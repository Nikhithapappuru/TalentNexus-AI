const express = require("express");
const {
  getMyJobMatch,
  getApplicationMatch,
  getJobApplicantMatches,
} = require("../controllers/matchController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/jobs/:jobId/me", protect, authorizeRoles("candidate"), getMyJobMatch);
router.get(
  "/applications/:applicationId",
  protect,
  authorizeRoles("recruiter"),
  getApplicationMatch
);
router.get(
  "/jobs/:jobId/applicants",
  protect,
  authorizeRoles("recruiter"),
  getJobApplicantMatches
);

module.exports = router;
