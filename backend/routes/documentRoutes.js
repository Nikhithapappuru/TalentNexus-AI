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
  answerFromDocuments,
} = require("../controllers/documentController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const createUpload = require("../middleware/uploadMiddleware");
const {
  validateBody,
  validateEnumBody,
  validateUuidParam,
} = require("../middleware/validateRequest");

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
  validateEnumBody("documentType", [
    "job_description",
    "recruiter_guideline",
    "career_resource",
  ]),
  uploadCompanyDocument
);
router.get("/mine", getMyDocuments);
router.post("/search", validateBody(["query"]), searchDocumentChunks);
router.post("/answer", validateBody(["question"]), answerFromDocuments);
router.get("/:id/chunks", validateUuidParam("id"), getDocumentChunks);
router.post(
  "/:id/chunks/regenerate",
  validateUuidParam("id"),
  regenerateDocumentChunks
);
router.post("/:id/chunks/embed", validateUuidParam("id"), embedDocumentChunks);
router.get("/:id", validateUuidParam("id"), getDocumentById);

module.exports = router;
