const express = require("express");
const {
  getResumeFeedback,
  getSkillGapForJob,
  getJobRecommendations,
} = require("../controllers/aiController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect, authorizeRoles("candidate"));

router.get("/resume-feedback", getResumeFeedback);
router.get("/jobs/:jobId/skill-gap", getSkillGapForJob);
router.get("/job-recommendations", getJobRecommendations);

module.exports = router;
