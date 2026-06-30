const pool = require("../config/db");

const allowedAccountStatuses = ["active", "inactive", "suspended"];
const allowedVerificationStatuses = ["pending", "verified"];

const getPlatformStats = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        (SELECT COUNT(*)::int FROM users) AS users,
        (SELECT COUNT(*)::int FROM candidate_profiles) AS candidates,
        (SELECT COUNT(*)::int FROM recruiter_profiles) AS recruiters,
        (SELECT COUNT(*)::int FROM companies) AS companies,
        (SELECT COUNT(*)::int FROM jobs) AS jobs,
        (SELECT COUNT(*)::int FROM applications) AS applications,
        (SELECT COUNT(*)::int FROM documents) AS documents`
    );

    return res.status(200).json({
      status: "success",
      stats: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, role, account_status, verification_status,
          last_login, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    return res.status(200).json({
      status: "success",
      count: result.rows.length,
      users: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { accountStatus, verificationStatus } = req.body;

    if (
      accountStatus &&
      !allowedAccountStatuses.includes(accountStatus)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Invalid account status",
      });
    }

    if (
      verificationStatus &&
      !allowedVerificationStatuses.includes(verificationStatus)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Invalid verification status",
      });
    }

    const result = await pool.query(
      `UPDATE users
       SET account_status = COALESCE($1, account_status),
           verification_status = COALESCE($2, verification_status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, email, role, account_status, verification_status, updated_at`,
      [accountStatus || null, verificationStatus || null, req.params.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "success",
      user: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getCompanies = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT companies.*,
          COUNT(recruiter_profiles.id)::int AS recruiter_count,
          COUNT(jobs.id)::int AS job_count
       FROM companies
       LEFT JOIN recruiter_profiles ON recruiter_profiles.company_id = companies.id
       LEFT JOIN jobs ON jobs.company_id = companies.id
       GROUP BY companies.id
       ORDER BY companies.created_at DESC`
    );

    return res.status(200).json({
      status: "success",
      count: result.rows.length,
      companies: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

module.exports = {
  getPlatformStats,
  getUsers,
  updateUserStatus,
  getCompanies,
};
