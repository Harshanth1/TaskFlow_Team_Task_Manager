const { body } = require('express-validator');

const createProjectValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Project name is required')
    .isLength({ max: 100 })
    .withMessage('Project name cannot exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Invalid deadline date format'),
  body('team')
    .optional()
    .isMongoId()
    .withMessage('Invalid team ID'),
];

const updateProjectValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Project name cannot exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('status')
    .optional()
    .isIn(['active', 'completed', 'archived'])
    .withMessage('Status must be active, completed, or archived'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Invalid deadline date format'),
];

module.exports = { createProjectValidator, updateProjectValidator };
