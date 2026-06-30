const pool = require("../config/db");

const clampScore = (value) => Math.max(0, Math.min(100, Number(value.toFixed(2))));

const getJob = async (jobId) => {
  const result = await pool.query(
    `SELECT id, title, experience_required
     FROM jobs
     WHERE id = $1`,
    [jobId]
  );

  return result.rows[0];
};

const getCandidateSkills = async (candidateId) => {
  const result = await pool.query(
    `SELECT skills.id, skills.name, candidate_skills.years_of_experience
     FROM candidate_skills
     INNER JOIN skills ON skills.id = candidate_skills.skill_id
     WHERE candidate_skills.candidate_id = $1`,
    [candidateId]
  );

  return result.rows;
};

const getJobSkills = async (jobId) => {
  const result = await pool.query(
    `SELECT skills.id, skills.name, job_skills.is_required, job_skills.weight
     FROM job_skills
     INNER JOIN skills ON skills.id = job_skills.skill_id
     WHERE job_skills.job_id = $1`,
    [jobId]
  );

  return result.rows;
};

const getExperienceYears = async (candidateId) => {
  const result = await pool.query(
    `SELECT start_date, end_date, is_current
     FROM experience
     WHERE candidate_id = $1`,
    [candidateId]
  );

  const now = new Date();

  return result.rows.reduce((total, item) => {
    if (!item.start_date) {
      return total;
    }

    const start = new Date(item.start_date);
    const end = item.is_current || !item.end_date ? now : new Date(item.end_date);
    const years = Math.max(0, (end - start) / (1000 * 60 * 60 * 24 * 365.25));

    return total + years;
  }, 0);
};

const getEducationCount = async (candidateId) => {
  const result = await pool.query(
    "SELECT COUNT(*)::int AS count FROM education WHERE candidate_id = $1",
    [candidateId]
  );

  return result.rows[0].count;
};

const getProjectTechStack = async (candidateId) => {
  const result = await pool.query(
    `SELECT tech_stack
     FROM projects
     WHERE candidate_id = $1
       AND tech_stack IS NOT NULL`,
    [candidateId]
  );

  return result.rows.flatMap((project) => project.tech_stack || []);
};

const calculateSkillScore = (candidateSkills, jobSkills) => {
  if (jobSkills.length === 0) {
    return {
      score: 0,
      matchedSkills: [],
      missingSkills: [],
    };
  }

  const candidateSkillIds = new Set(candidateSkills.map((skill) => skill.id));
  const totalWeight = jobSkills.reduce((sum, skill) => sum + Number(skill.weight || 1), 0);
  const matched = jobSkills.filter((skill) => candidateSkillIds.has(skill.id));
  const matchedWeight = matched.reduce((sum, skill) => sum + Number(skill.weight || 1), 0);

  return {
    score: totalWeight === 0 ? 0 : (matchedWeight / totalWeight) * 100,
    matchedSkills: matched.map((skill) => skill.name),
    missingSkills: jobSkills
      .filter((skill) => !candidateSkillIds.has(skill.id))
      .map((skill) => skill.name),
  };
};

const calculateProjectScore = (projectTechStack, jobSkills) => {
  if (jobSkills.length === 0 || projectTechStack.length === 0) {
    return 0;
  }

  const projectTech = new Set(projectTechStack.map((tech) => tech.toLowerCase()));
  const matchedCount = jobSkills.filter((skill) =>
    projectTech.has(skill.name.toLowerCase())
  ).length;

  return (matchedCount / jobSkills.length) * 100;
};

const buildExplanation = ({
  score,
  skillScore,
  experienceScore,
  educationScore,
  projectScore,
  matchedSkills,
  missingSkills,
}) => {
  const parts = [
    `Overall match score is ${score}.`,
    `Skill match contributed ${skillScore.toFixed(2)} out of 100.`,
    `Experience match contributed ${experienceScore.toFixed(2)} out of 100.`,
    `Education signal contributed ${educationScore.toFixed(2)} out of 100.`,
    `Project relevance contributed ${projectScore.toFixed(2)} out of 100.`,
  ];

  if (matchedSkills.length > 0) {
    parts.push(`Matched skills: ${matchedSkills.join(", ")}.`);
  }

  if (missingSkills.length > 0) {
    parts.push(`Missing or unlisted skills: ${missingSkills.join(", ")}.`);
  }

  return parts.join(" ");
};

const calculateCandidateJobMatch = async (candidateId, jobId) => {
  const job = await getJob(jobId);

  if (!job) {
    throw new Error("Job not found");
  }

  const [candidateSkills, jobSkills, experienceYears, educationCount, projectTechStack] =
    await Promise.all([
      getCandidateSkills(candidateId),
      getJobSkills(jobId),
      getExperienceYears(candidateId),
      getEducationCount(candidateId),
      getProjectTechStack(candidateId),
    ]);

  const { score: skillScore, matchedSkills, missingSkills } = calculateSkillScore(
    candidateSkills,
    jobSkills
  );
  const requiredYears = Number(job.experience_required || 0);
  const experienceScore =
    requiredYears === 0 ? 100 : Math.min((experienceYears / requiredYears) * 100, 100);
  const educationScore = educationCount > 0 ? 100 : 0;
  const projectScore = calculateProjectScore(projectTechStack, jobSkills);

  const overallScore = clampScore(
    skillScore * 0.45 +
      experienceScore * 0.25 +
      educationScore * 0.15 +
      projectScore * 0.15
  );

  return {
    score: overallScore,
    breakdown: {
      skillScore: clampScore(skillScore),
      experienceScore: clampScore(experienceScore),
      educationScore: clampScore(educationScore),
      projectScore: clampScore(projectScore),
      experienceYears: Number(experienceYears.toFixed(2)),
      requiredYears,
    },
    matchedSkills,
    missingSkills,
    explanation: buildExplanation({
      score: overallScore,
      skillScore,
      experienceScore,
      educationScore,
      projectScore,
      matchedSkills,
      missingSkills,
    }),
  };
};

module.exports = {
  calculateCandidateJobMatch,
};
