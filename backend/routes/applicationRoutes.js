const express = require("express");
const {
  applyToJob,
  getMyApplications,
  getApplicantsForJob,
  updateApplicationStatus,
} = require("../controllers/applicationController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/", protect, authorizeRoles("candidate"), applyToJob);
router.get("/mine", protect, authorizeRoles("candidate"), getMyApplications);
router.get(
  "/jobs/:jobId/applicants",
  protect,
  authorizeRoles("recruiter"),
  getApplicantsForJob
);
router.patch(
  "/:id/status",
  protect,
  authorizeRoles("recruiter"),
  updateApplicationStatus
);

module.exports = router;
