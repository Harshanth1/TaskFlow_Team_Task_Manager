const { body } = require('express-validator');

const createTaskValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('project')
    .notEmpty()
    .withMessage('Project ID is required')
    .isMongoId()
    .withMessage('Invalid project ID'),
  body('assignee')
    .optional()
    .isMongoId()
    .withMessage('Invalid assignee ID'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid due date format'),
];

const updateTaskValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'review', 'completed'])
    .withMessage('Status must be todo, in-progress, review, or completed'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('assignee')
    .optional()
    .isMongoId()
    .withMessage('Invalid assignee ID'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid due date format'),
];

module.exports = { createTaskValidator, updateTaskValidator };
