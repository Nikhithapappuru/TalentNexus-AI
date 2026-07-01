const express = require("express");
const {
  getMyJobMatch,
  getApplicationMatch,
  getJobApplicantMatches,
} = require("../controllers/matchController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { validateUuidParam } = require("../middleware/validateRequest");

const router = express.Router();

router.get(
  "/jobs/:jobId/me",
  protect,
  authorizeRoles("candidate"),
  validateUuidParam("jobId"),
  getMyJobMatch
);
router.get(
  "/applications/:applicationId",
  protect,
  authorizeRoles("recruiter"),
  validateUuidParam("applicationId"),
  getApplicationMatch
);
router.get(
  "/jobs/:jobId/applicants",
  protect,
  authorizeRoles("recruiter"),
  validateUuidParam("jobId"),
  getJobApplicantMatches
);

module.exports = router;
