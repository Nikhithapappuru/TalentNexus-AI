const fs = require("fs");
const path = require("path");
const multer = require("multer");

const allowedMimeTypes = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const createStorage = (folderName) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, "..", "uploads", folderName);

      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`;

      cb(null, uniqueName);
    },
  });

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Only PDF, TXT, DOC, and DOCX files are allowed"));
  }

  return cb(null, true);
};

const createUpload = (folderName) =>
  multer({
    storage: createStorage(folderName),
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });

module.exports = createUpload;
