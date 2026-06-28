const express = require("express");
const {
  createCandidateProfile,
  getMyCandidateProfile,
  createCompany,
  createRecruiterProfile,
  getMyRecruiterProfile,
} = require("../controllers/profileController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/candidate",
  protect,
  authorizeRoles("candidate"),
  createCandidateProfile
);
router.get("/candidate/me", protect, authorizeRoles("candidate"), getMyCandidateProfile);

router.post("/companies", protect, authorizeRoles("recruiter", "admin"), createCompany);
router.post(
  "/recruiter",
  protect,
  authorizeRoles("recruiter"),
  createRecruiterProfile
);
router.get("/recruiter/me", protect, authorizeRoles("recruiter"), getMyRecruiterProfile);

module.exports = router;
