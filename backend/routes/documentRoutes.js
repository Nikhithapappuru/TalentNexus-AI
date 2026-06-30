const express = require("express");
const {
  uploadResume,
  uploadCompanyDocument,
  getMyDocuments,
  getDocumentById,
  getDocumentChunks,
  regenerateDocumentChunks,
  embedDocumentChunks,
  searchDocumentChunks,
} = require("../controllers/documentController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const createUpload = require("../middleware/uploadMiddleware");

const router = express.Router();
const resumeUpload = createUpload("resumes");
const companyDocumentUpload = createUpload("company-documents");

router.use(protect);

router.post(
  "/resume",
  authorizeRoles("candidate"),
  resumeUpload.single("file"),
  uploadResume
);
router.post(
  "/company",
  authorizeRoles("recruiter"),
  companyDocumentUpload.single("file"),
  uploadCompanyDocument
);
router.get("/mine", getMyDocuments);
router.post("/search", searchDocumentChunks);
router.get("/:id/chunks", getDocumentChunks);
router.post("/:id/chunks/regenerate", regenerateDocumentChunks);
router.post("/:id/chunks/embed", embedDocumentChunks);
router.get("/:id", getDocumentById);

module.exports = router;
