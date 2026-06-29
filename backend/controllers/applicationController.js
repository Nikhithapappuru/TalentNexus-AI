const pool = require("../config/db");

const allowedStatuses = [
  "applied",
  "reviewing",
  "shortlisted",
  "interview_scheduled",
  "interview_completed",
  "offer_extended",
  "accepted",
  "rejected",
  "withdrawn",
];

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

const applyToJob = async (req, res) => {
  try {
    const { jobId, resumeDocumentId } = req.body;

    if (!jobId) {
      return res.status(400).json({
        status: "error",
        message: "Job id is required",
      });
    }

    const candidateProfile = await getCandidateProfile(req.user.id);

    if (!candidateProfile) {
      return res.status(404).json({
        status: "error",
        message: "Candidate profile is required before applying",
      });
    }

    const job = await pool.query("SELECT id FROM jobs WHERE id = $1", [jobId]);

    if (job.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Job not found",
      });
    }

    if (resumeDocumentId) {
      const resume = await pool.query(
        `SELECT id FROM documents
         WHERE id = $1
           AND owner_user_id = $2
           AND document_type = 'resume'`,
        [resumeDocumentId, req.user.id]
      );

      if (resume.rows.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "Resume document not found",
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO applications (candidate_id, job_id, resume_document_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [candidateProfile.id, jobId, resumeDocumentId || null]
    );

    return res.status(201).json({
      status: "success",
      application: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        status: "error",
        message: "You have already applied to this job",
      });
    }

    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const candidateProfile = await getCandidateProfile(req.user.id);

    if (!candidateProfile) {
      return res.status(404).json({
        status: "error",
        message: "Candidate profile not found",
      });
    }

    const result = await pool.query(
      `SELECT
          applications.*,
          jobs.title,
          jobs.location,
          jobs.employment_type,
          jobs.work_mode,
          companies.company_name
       FROM applications
       INNER JOIN jobs ON jobs.id = applications.job_id
       INNER JOIN companies ON companies.id = jobs.company_id
       WHERE applications.candidate_id = $1
       ORDER BY applications.applied_at DESC`,
      [candidateProfile.id]
    );

    return res.status(200).json({
      status: "success",
      count: result.rows.length,
      applications: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getApplicantsForJob = async (req, res) => {
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

    const result = await pool.query(
      `SELECT
          applications.*,
          candidate_profiles.full_name,
          candidate_profiles.headline,
          candidate_profiles.location,
          users.email
       FROM applications
       INNER JOIN candidate_profiles ON candidate_profiles.id = applications.candidate_id
       INNER JOIN users ON users.id = candidate_profiles.user_id
       WHERE applications.job_id = $1
       ORDER BY applications.applied_at DESC`,
      [req.params.jobId]
    );

    return res.status(200).json({
      status: "success",
      count: result.rows.length,
      applicants: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { status, recruiterNotes } = req.body;

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: "Valid application status is required",
      });
    }

    const recruiterProfile = await getRecruiterProfile(req.user.id);

    if (!recruiterProfile) {
      return res.status(404).json({
        status: "error",
        message: "Recruiter profile not found",
      });
    }

    const ownership = await pool.query(
      `SELECT applications.id
       FROM applications
       INNER JOIN jobs ON jobs.id = applications.job_id
       WHERE applications.id = $1
         AND jobs.created_by = $2`,
      [req.params.id, recruiterProfile.id]
    );

    if (ownership.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Application not found for this recruiter",
      });
    }

    const result = await pool.query(
      `UPDATE applications
       SET status = $1,
           recruiter_notes = COALESCE($2, recruiter_notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, recruiterNotes || null, req.params.id]
    );

    return res.status(200).json({
      status: "success",
      application: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

module.exports = {
  applyToJob,
  getMyApplications,
  getApplicantsForJob,
  updateApplicationStatus,
};
