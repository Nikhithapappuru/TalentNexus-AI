const pool = require("../config/db");

const getCandidateProfile = async (userId) => {
  const result = await pool.query(
    "SELECT id FROM candidate_profiles WHERE user_id = $1",
    [userId]
  );

  return result.rows[0];
};

const requireCandidateProfile = async (req, res) => {
  const candidateProfile = await getCandidateProfile(req.user.id);

  if (!candidateProfile) {
    res.status(404).json({
      status: "error",
      message: "Candidate profile is required",
    });
    return null;
  }

  return candidateProfile;
};

const addSkill = async (req, res) => {
  try {
    const { name, category, proficiencyLevel, yearsOfExperience } = req.body;

    if (!name) {
      return res.status(400).json({
        status: "error",
        message: "Skill name is required",
      });
    }

    const candidateProfile = await requireCandidateProfile(req, res);
    if (!candidateProfile) return;

    const skillResult = await pool.query(
      `INSERT INTO skills (name, category)
       VALUES ($1, $2)
       ON CONFLICT (name)
       DO UPDATE SET category = COALESCE(EXCLUDED.category, skills.category)
       RETURNING id, name, category`,
      [name.trim(), category || null]
    );

    const skill = skillResult.rows[0];

    const result = await pool.query(
      `INSERT INTO candidate_skills
        (candidate_id, skill_id, proficiency_level, years_of_experience)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (candidate_id, skill_id)
       DO UPDATE SET
          proficiency_level = EXCLUDED.proficiency_level,
          years_of_experience = EXCLUDED.years_of_experience
       RETURNING *`,
      [
        candidateProfile.id,
        skill.id,
        proficiencyLevel || null,
        yearsOfExperience || null,
      ]
    );

    return res.status(201).json({
      status: "success",
      skill: {
        ...result.rows[0],
        name: skill.name,
        category: skill.category,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getMySkills = async (req, res) => {
  try {
    const candidateProfile = await requireCandidateProfile(req, res);
    if (!candidateProfile) return;

    const result = await pool.query(
      `SELECT
          candidate_skills.id,
          skills.id AS skill_id,
          skills.name,
          skills.category,
          candidate_skills.proficiency_level,
          candidate_skills.years_of_experience
       FROM candidate_skills
       INNER JOIN skills ON skills.id = candidate_skills.skill_id
       WHERE candidate_skills.candidate_id = $1
       ORDER BY skills.name ASC`,
      [candidateProfile.id]
    );

    return res.status(200).json({
      status: "success",
      count: result.rows.length,
      skills: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const addProject = async (req, res) => {
  try {
    const {
      title,
      description,
      projectUrl,
      githubUrl,
      techStack,
      startDate,
      endDate,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        status: "error",
        message: "Project title is required",
      });
    }

    const candidateProfile = await requireCandidateProfile(req, res);
    if (!candidateProfile) return;

    const result = await pool.query(
      `INSERT INTO projects
        (candidate_id, title, description, project_url, github_url, tech_stack, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        candidateProfile.id,
        title,
        description || null,
        projectUrl || null,
        githubUrl || null,
        Array.isArray(techStack) ? techStack : null,
        startDate || null,
        endDate || null,
      ]
    );

    return res.status(201).json({
      status: "success",
      project: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getMyProjects = async (req, res) => {
  try {
    const candidateProfile = await requireCandidateProfile(req, res);
    if (!candidateProfile) return;

    const result = await pool.query(
      `SELECT *
       FROM projects
       WHERE candidate_id = $1
       ORDER BY created_at DESC`,
      [candidateProfile.id]
    );

    return res.status(200).json({
      status: "success",
      count: result.rows.length,
      projects: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const addEducation = async (req, res) => {
  try {
    const { institutionName, degree, fieldOfStudy, startYear, endYear, grade } =
      req.body;

    if (!institutionName) {
      return res.status(400).json({
        status: "error",
        message: "Institution name is required",
      });
    }

    const candidateProfile = await requireCandidateProfile(req, res);
    if (!candidateProfile) return;

    const result = await pool.query(
      `INSERT INTO education
        (candidate_id, institution_name, degree, field_of_study, start_year, end_year, grade)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        candidateProfile.id,
        institutionName,
        degree || null,
        fieldOfStudy || null,
        startYear || null,
        endYear || null,
        grade || null,
      ]
    );

    return res.status(201).json({
      status: "success",
      education: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getMyEducation = async (req, res) => {
  try {
    const candidateProfile = await requireCandidateProfile(req, res);
    if (!candidateProfile) return;

    const result = await pool.query(
      `SELECT *
       FROM education
       WHERE candidate_id = $1
       ORDER BY end_year DESC NULLS FIRST, start_year DESC NULLS LAST`,
      [candidateProfile.id]
    );

    return res.status(200).json({
      status: "success",
      count: result.rows.length,
      education: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const addExperience = async (req, res) => {
  try {
    const {
      companyName,
      roleTitle,
      description,
      startDate,
      endDate,
      isCurrent,
    } = req.body;

    if (!companyName || !roleTitle) {
      return res.status(400).json({
        status: "error",
        message: "Company name and role title are required",
      });
    }

    const candidateProfile = await requireCandidateProfile(req, res);
    if (!candidateProfile) return;

    const result = await pool.query(
      `INSERT INTO experience
        (candidate_id, company_name, role_title, description, start_date, end_date, is_current)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        candidateProfile.id,
        companyName,
        roleTitle,
        description || null,
        startDate || null,
        endDate || null,
        Boolean(isCurrent),
      ]
    );

    return res.status(201).json({
      status: "success",
      experience: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getMyExperience = async (req, res) => {
  try {
    const candidateProfile = await requireCandidateProfile(req, res);
    if (!candidateProfile) return;

    const result = await pool.query(
      `SELECT *
       FROM experience
       WHERE candidate_id = $1
       ORDER BY is_current DESC, end_date DESC NULLS FIRST, start_date DESC NULLS LAST`,
      [candidateProfile.id]
    );

    return res.status(200).json({
      status: "success",
      count: result.rows.length,
      experience: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

module.exports = {
  addSkill,
  getMySkills,
  addProject,
  getMyProjects,
  addEducation,
  getMyEducation,
  addExperience,
  getMyExperience,
};
