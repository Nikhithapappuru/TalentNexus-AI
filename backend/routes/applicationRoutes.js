const express = require("express");
const {
  applyToJob,
  getMyApplications,
  getApplicantsForJob,
  updateApplicationStatus,
} = require("../controllers/applicationController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const {
  validateBody,
  validateEnumBody,
  validateUuidParam,
} = require("../middleware/validateRequest");

const router = express.Router();

router.post(
  "/",
  protect,
  authorizeRoles("candidate"),
  validateBody(["jobId"]),
  applyToJob
);
router.get("/mine", protect, authorizeRoles("candidate"), getMyApplications);
router.get(
  "/jobs/:jobId/applicants",
  protect,
  authorizeRoles("recruiter"),
  validateUuidParam("jobId"),
  getApplicantsForJob
);
router.patch(
  "/:id/status",
  protect,
  authorizeRoles("recruiter"),
  validateUuidParam("id"),
  validateBody(["status"]),
  validateEnumBody("status", [
    "applied",
    "reviewing",
    "shortlisted",
    "interview_scheduled",
    "interview_completed",
    "offer_extended",
    "accepted",
    "rejected",
    "withdrawn",
  ]),
  updateApplicationStatus
);

module.exports = router;
