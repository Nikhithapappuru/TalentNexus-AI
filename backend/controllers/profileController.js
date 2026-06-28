const pool = require("../config/db");

const createCandidateProfile = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      headline,
      bio,
      location,
      profilePhotoUrl,
    } = req.body;

    if (!fullName) {
      return res.status(400).json({
        status: "error",
        message: "Full name is required",
      });
    }

    const existingProfile = await pool.query(
      "SELECT id FROM candidate_profiles WHERE user_id = $1",
      [req.user.id]
    );

    if (existingProfile.rows.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "Candidate profile already exists",
      });
    }

    const result = await pool.query(
      `INSERT INTO candidate_profiles
        (user_id, full_name, phone, headline, bio, location, profile_photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.id,
        fullName,
        phone || null,
        headline || null,
        bio || null,
        location || null,
        profilePhotoUrl || null,
      ]
    );

    return res.status(201).json({
      status: "success",
      profile: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getMyCandidateProfile = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM candidate_profiles WHERE user_id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Candidate profile not found",
      });
    }

    return res.status(200).json({
      status: "success",
      profile: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const createCompany = async (req, res) => {
  try {
    const { companyName, description, website, location, logoUrl } = req.body;

    if (!companyName) {
      return res.status(400).json({
        status: "error",
        message: "Company name is required",
      });
    }

    const result = await pool.query(
      `INSERT INTO companies
        (company_name, description, website, location, logo_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        companyName,
        description || null,
        website || null,
        location || null,
        logoUrl || null,
      ]
    );

    return res.status(201).json({
      status: "success",
      company: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const createRecruiterProfile = async (req, res) => {
  try {
    const { fullName, designation, companyId } = req.body;

    if (!fullName) {
      return res.status(400).json({
        status: "error",
        message: "Full name is required",
      });
    }

    const existingProfile = await pool.query(
      "SELECT id FROM recruiter_profiles WHERE user_id = $1",
      [req.user.id]
    );

    if (existingProfile.rows.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "Recruiter profile already exists",
      });
    }

    if (companyId) {
      const company = await pool.query("SELECT id FROM companies WHERE id = $1", [
        companyId,
      ]);

      if (company.rows.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "Company not found",
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO recruiter_profiles
        (user_id, company_id, full_name, designation)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, companyId || null, fullName, designation || null]
    );

    return res.status(201).json({
      status: "success",
      profile: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getMyRecruiterProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT recruiter_profiles.*, companies.company_name
       FROM recruiter_profiles
       LEFT JOIN companies ON companies.id = recruiter_profiles.company_id
       WHERE recruiter_profiles.user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Recruiter profile not found",
      });
    }

    return res.status(200).json({
      status: "success",
      profile: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

module.exports = {
  createCandidateProfile,
  getMyCandidateProfile,
  createCompany,
  createRecruiterProfile,
  getMyRecruiterProfile,
};
