const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUser = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().trim(),
  handleValidationErrors
];

// Classroom validation rules
const validateClassroom = [
  body('code').notEmpty().trim(),
  body('name').notEmpty().trim(),
  body('capacity').isInt({ min: 1 }),
  body('building').notEmpty().trim(),
  body('type').isIn(['Lecture Hall', 'Seminar Room', 'Workshop', 'Lab', 'Computer Lab', 'Conference Room']),
  handleValidationErrors
];

// Faculty validation rules
const validateFaculty = [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('department').notEmpty().trim(),
  body('workload').isInt({ min: 0 }),
  handleValidationErrors
];

// Subject validation rules
const validateSubject = [
  body('name').notEmpty().trim(),
  body('code').notEmpty().trim(),
  body('credits').isInt({ min: 1, max: 10 }),
  body('department').notEmpty().trim(),
  body('type').isIn(['Core', 'Elective', 'Lab', 'Project', 'Workshop', 'Seminar']),
  handleValidationErrors
];

// Batch validation rules
const validateBatch = [
  body('name').notEmpty().trim(),
  body('code').notEmpty().trim(),
  body('department').notEmpty().trim(),
  handleValidationErrors
];

module.exports = {
  validateUser,
  validateClassroom,
  validateFaculty,
  validateSubject,
  validateBatch,
  handleValidationErrors
};