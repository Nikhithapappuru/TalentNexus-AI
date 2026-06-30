const express = require("express");
const { register, login, getMe } = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");
const { validateBody, validateEnumBody } = require("../middleware/validateRequest");

const router = express.Router();

router.post(
  "/register",
  validateBody(["email", "password", "role"]),
  validateEnumBody("role", ["candidate", "recruiter", "admin"]),
  register
);
router.post("/login", validateBody(["email", "password"]), login);
router.get("/me", protect, getMe);

module.exports = router;
