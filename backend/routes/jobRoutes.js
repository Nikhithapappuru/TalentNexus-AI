const express = require("express");
const {
  createJob,
  getJobs,
  getJobById,
  getMyJobs,
} = require("../controllers/jobController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", getJobs);
router.get("/mine", protect, authorizeRoles("recruiter"), getMyJobs);
router.get("/:id", getJobById);
router.post("/", protect, authorizeRoles("recruiter"), createJob);

module.exports = router;
