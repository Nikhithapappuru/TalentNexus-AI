const express = require("express");
const {
  createJob,
  getJobs,
  getJobById,
  getMyJobs,
  addJobSkill,
  getJobSkills,
} = require("../controllers/jobController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const {
  validateBody,
  validateEnumBody,
  validateUuidParam,
} = require("../middleware/validateRequest");

const router = express.Router();

router.get("/", getJobs);
router.get("/mine", protect, authorizeRoles("recruiter"), getMyJobs);
router.get("/:id/skills", validateUuidParam("id"), getJobSkills);
router.post(
  "/:id/skills",
  protect,
  authorizeRoles("recruiter"),
  validateUuidParam("id"),
  validateBody(["name"]),
  addJobSkill
);
router.get("/:id", validateUuidParam("id"), getJobById);
router.post(
  "/",
  protect,
  authorizeRoles("recruiter"),
  validateBody(["title", "description", "employmentType", "workMode"]),
  validateEnumBody("employmentType", ["full_time", "internship", "part_time", "contract"]),
  validateEnumBody("workMode", ["onsite", "hybrid", "remote"]),
  createJob
);

module.exports = router;
