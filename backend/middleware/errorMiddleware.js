const multer = require("multer");

const errorMiddleware = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      status: "error",
      message: error.message,
      code: error.code,
    });
  }

  if (error) {
    return res.status(500).json({
      status: "error",
      message: error.message || "Internal server error",
    });
  }

  return next();
};

module.exports = errorMiddleware;
