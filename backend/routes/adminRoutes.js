const express = require("express");
const {
  getPlatformStats,
  getUsers,
  updateUserStatus,
  getCompanies,
} = require("../controllers/adminController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect, authorizeRoles("admin"));

router.get("/stats", getPlatformStats);
router.get("/users", getUsers);
router.patch("/users/:userId/status", updateUserStatus);
router.get("/companies", getCompanies);

module.exports = router;
