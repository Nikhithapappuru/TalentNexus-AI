const pool = require("../config/db");
const { calculateCandidateJobMatch } = require("../services/matchingService");

const getCandidateProfile = async (userId) => {
  const result = await pool.query(
    "SELECT id FROM candidate_profiles WHERE user_id = $1",
    [userId]
  );

  return result.rows[0];
};

const getRecruiterProfile = async (userId) => {
  const result = await pool.query(
    "SELECT id FROM recruiter_profiles WHERE user_id = $1",
    [userId]
  );

  return result.rows[0];
};

const getMyJobMatch = async (req, res) => {
  try {
    const candidateProfile = await getCandidateProfile(req.user.id);

    if (!candidateProfile) {
      return res.status(404).json({
        status: "error",
        message: "Candidate profile not found",
      });
    }

    const match = await calculateCandidateJobMatch(candidateProfile.id, req.params.jobId);

    return res.status(200).json({
      status: "success",
      match,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getApplicationMatch = async (req, res) => {
  try {
    const recruiterProfile = await getRecruiterProfile(req.user.id);

    if (!recruiterProfile) {
      return res.status(404).json({
        status: "error",
        message: "Recruiter profile not found",
      });
    }

    const application = await pool.query(
      `SELECT applications.id, applications.candidate_id, applications.job_id
       FROM applications
       INNER JOIN jobs ON jobs.id = applications.job_id
       WHERE applications.id = $1
         AND jobs.created_by = $2`,
      [req.params.applicationId, recruiterProfile.id]
    );

    if (application.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Application not found for this recruiter",
      });
    }

    const match = await calculateCandidateJobMatch(
      application.rows[0].candidate_id,
      application.rows[0].job_id
    );

    await pool.query(
      `UPDATE applications
       SET semantic_match_score = $1,
           ai_explanation = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [match.score, match.explanation, application.rows[0].id]
    );

    return res.status(200).json({
      status: "success",
      applicationId: application.rows[0].id,
      match,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getJobApplicantMatches = async (req, res) => {
  try {
    const recruiterProfile = await getRecruiterProfile(req.user.id);

    if (!recruiterProfile) {
      return res.status(404).json({
        status: "error",
        message: "Recruiter profile not found",
      });
    }

    const job = await pool.query("SELECT id FROM jobs WHERE id = $1 AND created_by = $2", [
      req.params.jobId,
      recruiterProfile.id,
    ]);

    if (job.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Job not found for this recruiter",
      });
    }

    const applications = await pool.query(
      `SELECT applications.id, applications.candidate_id, candidate_profiles.full_name
       FROM applications
       INNER JOIN candidate_profiles ON candidate_profiles.id = applications.candidate_id
       WHERE applications.job_id = $1`,
      [req.params.jobId]
    );

    const matches = [];

    for (const application of applications.rows) {
      const match = await calculateCandidateJobMatch(
        application.candidate_id,
        req.params.jobId
      );

      matches.push({
        applicationId: application.id,
        candidateId: application.candidate_id,
        candidateName: application.full_name,
        match,
      });
    }

    matches.sort((a, b) => b.match.score - a.match.score);

    return res.status(200).json({
      status: "success",
      count: matches.length,
      matches,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

module.exports = {
  getMyJobMatch,
  getApplicationMatch,
  getJobApplicantMatches,
};
