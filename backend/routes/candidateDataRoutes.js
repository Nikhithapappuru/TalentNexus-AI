const express = require("express");
const {
  addSkill,
  getMySkills,
  addProject,
  getMyProjects,
  addEducation,
  getMyEducation,
  addExperience,
  getMyExperience,
} = require("../controllers/candidateDataController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect, authorizeRoles("candidate"));

router.post("/skills", addSkill);
router.get("/skills", getMySkills);

router.post("/projects", addProject);
router.get("/projects", getMyProjects);

router.post("/education", addEducation);
router.get("/education", getMyEducation);

router.post("/experience", addExperience);
router.get("/experience", getMyExperience);

module.exports = router;
