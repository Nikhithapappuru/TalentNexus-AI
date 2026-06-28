const pool = require("../config/db");

const allowedEmploymentTypes = ["full_time", "internship", "part_time", "contract"];
const allowedWorkModes = ["onsite", "hybrid", "remote"];

const getRecruiterProfile = async (userId) => {
  const result = await pool.query(
    "SELECT id, company_id FROM recruiter_profiles WHERE user_id = $1",
    [userId]
  );

  return result.rows[0];
};

const createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      experienceRequired,
      minimumSalary,
      maximumSalary,
      employmentType,
      workMode,
      location,
      applicationDeadline,
    } = req.body;

    if (!title || !description || !employmentType || !workMode) {
      return res.status(400).json({
        status: "error",
        message: "Title, description, employment type, and work mode are required",
      });
    }

    if (!allowedEmploymentTypes.includes(employmentType)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid employment type",
      });
    }

    if (!allowedWorkModes.includes(workMode)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid work mode",
      });
    }

    const recruiterProfile = await getRecruiterProfile(req.user.id);

    if (!recruiterProfile) {
      return res.status(404).json({
        status: "error",
        message: "Recruiter profile is required before posting jobs",
      });
    }

    if (!recruiterProfile.company_id) {
      return res.status(400).json({
        status: "error",
        message: "Recruiter profile must be linked to a company",
      });
    }

    const result = await pool.query(
      `INSERT INTO jobs
        (
          company_id,
          created_by,
          title,
          description,
          experience_required,
          minimum_salary,
          maximum_salary,
          employment_type,
          work_mode,
          location,
          application_deadline
        )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        recruiterProfile.company_id,
        recruiterProfile.id,
        title,
        description,
        experienceRequired || 0,
        minimumSalary || null,
        maximumSalary || null,
        employmentType,
        workMode,
        location || null,
        applicationDeadline || null,
      ]
    );

    return res.status(201).json({
      status: "success",
      job: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getJobs = async (req, res) => {
  try {
    const { employmentType, workMode, location } = req.query;
    const conditions = [];
    const values = [];

    if (employmentType) {
      values.push(employmentType);
      conditions.push(`jobs.employment_type = $${values.length}`);
    }

    if (workMode) {
      values.push(workMode);
      conditions.push(`jobs.work_mode = $${values.length}`);
    }

    if (location) {
      values.push(`%${location}%`);
      conditions.push(`jobs.location ILIKE $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT
          jobs.*,
          companies.company_name,
          recruiter_profiles.full_name AS recruiter_name
       FROM jobs
       INNER JOIN companies ON companies.id = jobs.company_id
       INNER JOIN recruiter_profiles ON recruiter_profiles.id = jobs.created_by
       ${whereClause}
       ORDER BY jobs.created_at DESC`,
      values
    );

    return res.status(200).json({
      status: "success",
      count: result.rows.length,
      jobs: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getJobById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
          jobs.*,
          companies.company_name,
          companies.website,
          companies.logo_url,
          recruiter_profiles.full_name AS recruiter_name
       FROM jobs
       INNER JOIN companies ON companies.id = jobs.company_id
       INNER JOIN recruiter_profiles ON recruiter_profiles.id = jobs.created_by
       WHERE jobs.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Job not found",
      });
    }

    return res.status(200).json({
      status: "success",
      job: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getMyJobs = async (req, res) => {
  try {
    const recruiterProfile = await getRecruiterProfile(req.user.id);

    if (!recruiterProfile) {
      return res.status(404).json({
        status: "error",
        message: "Recruiter profile not found",
      });
    }

    const result = await pool.query(
      `SELECT jobs.*, companies.company_name
       FROM jobs
       INNER JOIN companies ON companies.id = jobs.company_id
       WHERE jobs.created_by = $1
       ORDER BY jobs.created_at DESC`,
      [recruiterProfile.id]
    );

    return res.status(200).json({
      status: "success",
      count: result.rows.length,
      jobs: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  getMyJobs,
};
