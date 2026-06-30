const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const validateBody = (requiredFields = []) => {
  return (req, res, next) => {
    const missingFields = requiredFields.filter((field) => {
      const value = req.body?.[field];
      return value === undefined || value === null || value === "";
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: "error",
        message: `Missing required field(s): ${missingFields.join(", ")}`,
      });
    }

    return next();
  };
};

const validateEnumBody = (field, allowedValues) => {
  return (req, res, next) => {
    const value = req.body?.[field];

    if (value !== undefined && !allowedValues.includes(value)) {
      return res.status(400).json({
        status: "error",
        message: `${field} must be one of: ${allowedValues.join(", ")}`,
      });
    }

    return next();
  };
};

const validateUuidParam = (paramName) => {
  return (req, res, next) => {
    const value = req.params?.[paramName];

    if (!uuidPattern.test(value)) {
      return res.status(400).json({
        status: "error",
        message: `${paramName} must be a valid UUID`,
      });
    }

    return next();
  };
};

module.exports = {
  validateBody,
  validateEnumBody,
  validateUuidParam,
};
