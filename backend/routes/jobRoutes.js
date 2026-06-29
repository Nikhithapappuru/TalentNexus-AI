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

const router = express.Router();

router.get("/", getJobs);
router.get("/mine", protect, authorizeRoles("recruiter"), getMyJobs);
router.get("/:id/skills", getJobSkills);
router.post("/:id/skills", protect, authorizeRoles("recruiter"), addJobSkill);
router.get("/:id", getJobById);
router.post("/", protect, authorizeRoles("recruiter"), createJob);

module.exports = router;
