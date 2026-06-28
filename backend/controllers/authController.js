const bcrypt = require("bcrypt");
const pool = require("../config/db");
const generateToken = require("../utils/generateToken");

const allowedRoles = ["candidate", "recruiter", "admin"];

const normalizeEmail = (email) => email.trim().toLowerCase();

const register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        status: "error",
        message: "Email, password, and role are required",
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid user role",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        status: "error",
        message: "Password must be at least 8 characters long",
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [
      normalizedEmail,
    ]);

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "User already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, email, role, account_status, verification_status, created_at`,
      [normalizedEmail, passwordHash, role]
    );

    const user = result.rows[0];

    return res.status(201).json({
      status: "success",
      user,
      token: generateToken(user),
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Email and password are required",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const result = await pool.query(
      `SELECT id, email, password_hash, role, account_status, verification_status, created_at
       FROM users
       WHERE email = $1`,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    await pool.query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1", [
      user.id,
    ]);

    delete user.password_hash;

    return res.status(200).json({
      status: "success",
      user,
      token: generateToken(user),
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getMe = async (req, res) => {
  return res.status(200).json({
    status: "success",
    user: req.user,
  });
};

module.exports = {
  register,
  login,
  getMe,
};
