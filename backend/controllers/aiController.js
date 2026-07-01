const pool = require("../config/db");
const { calculateCandidateJobMatch } = require("../services/matchingService");
const { generateText, GENERATION_MODEL } = require("../services/generationService");

const getCandidateProfile = async (userId) => {
  const result = await pool.query(
    "SELECT * FROM candidate_profiles WHERE user_id = $1",
    [userId]
  );

  return result.rows[0];
};

const getCandidateSkills = async (candidateId) => {
  const result = await pool.query(
    `SELECT skills.name, skills.category, candidate_skills.proficiency_level,
        candidate_skills.years_of_experience
     FROM candidate_skills
     INNER JOIN skills ON skills.id = candidate_skills.skill_id
     WHERE candidate_skills.candidate_id = $1
     ORDER BY skills.name ASC`,
    [candidateId]
  );

  return result.rows;
};

const getLatestResume = async (userId) => {
  const result = await pool.query(
    `SELECT id, original_filename, extracted_text, uploaded_at
     FROM documents
     WHERE owner_user_id = $1
       AND document_type = 'resume'
     ORDER BY uploaded_at DESC
     LIMIT 1`,
    [userId]
  );

  return result.rows[0];
};

const getResumeFeedback = async (req, res) => {
  try {
    const candidateProfile = await getCandidateProfile(req.user.id);

    if (!candidateProfile) {
      return res.status(404).json({
        status: "error",
        message: "Candidate profile not found",
      });
    }

    const resume = await getLatestResume(req.user.id);

    if (!resume || !resume.extracted_text) {
      return res.status(400).json({
        status: "error",
        message: "Upload a PDF or TXT resume with extractable text first",
      });
    }

    const skills = await getCandidateSkills(candidateProfile.id);
    const prompt = `You are TalentNexus AI, a career assistant.

Review this candidate resume and provide practical improvement feedback.
Return concise sections for strengths, missing skills, weak sections, better keywords, and next actions.

Candidate profile:
${JSON.stringify(candidateProfile, null, 2)}

Structured skills:
${JSON.stringify(skills, null, 2)}

Resume text:
${resume.extracted_text.slice(0, 12000)}`;

    const feedback = await generateText(prompt);

    return res.status(200).json({
      status: "success",
      model: GENERATION_MODEL,
      resume: {
        id: resume.id,
        filename: resume.original_filename,
      },
      feedback,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getSkillGapForJob = async (req, res) => {
  try {
    const candidateProfile = await getCandidateProfile(req.user.id);

    if (!candidateProfile) {
      return res.status(404).json({
        status: "error",
        message: "Candidate profile not found",
      });
    }

    const match = await calculateCandidateJobMatch(candidateProfile.id, req.params.jobId);
    const job = await pool.query(
      `SELECT jobs.title, jobs.description, companies.company_name
       FROM jobs
       INNER JOIN companies ON companies.id = jobs.company_id
       WHERE jobs.id = $1`,
      [req.params.jobId]
    );

    if (job.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Job not found",
      });
    }

    const prompt = `You are TalentNexus AI.

Explain this candidate's skill gaps for the job and give a short learning plan.

Job:
${JSON.stringify(job.rows[0], null, 2)}

Match result:
${JSON.stringify(match, null, 2)}

Focus on missing skills, project ideas, and what to learn first.`;

    const guidance = await generateText(prompt);

    return res.status(200).json({
      status: "success",
      model: GENERATION_MODEL,
      match,
      guidance,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getJobRecommendations = async (req, res) => {
  try {
    const candidateProfile = await getCandidateProfile(req.user.id);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 20);

    if (!candidateProfile) {
      return res.status(404).json({
        status: "error",
        message: "Candidate profile not found",
      });
    }

    const jobs = await pool.query(
      `SELECT jobs.id, jobs.title, jobs.location, jobs.employment_type,
          jobs.work_mode, companies.company_name
       FROM jobs
       INNER JOIN companies ON companies.id = jobs.company_id
       ORDER BY jobs.created_at DESC
       LIMIT 50`
    );

    const recommendations = [];

    for (const job of jobs.rows) {
      const match = await calculateCandidateJobMatch(candidateProfile.id, job.id);

      recommendations.push({
        job,
        match,
      });
    }

    recommendations.sort((a, b) => b.match.score - a.match.score);

    return res.status(200).json({
      status: "success",
      count: recommendations.slice(0, limit).length,
      recommendations: recommendations.slice(0, limit),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message,
    });
  }
};

module.exports = {
  getResumeFeedback,
  getSkillGapForJob,
  getJobRecommendations,
};
