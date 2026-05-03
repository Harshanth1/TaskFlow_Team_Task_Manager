const express = require('express');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getOverdueTasks,
  getTaskStats,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { createTaskValidator, updateTaskValidator } = require('../validators/taskValidator');
const validate = require('../middleware/validate');

const router = express.Router();

// Stats and overdue routes must come before /:id to avoid conflict
router.get('/stats', protect, getTaskStats);
router.get('/overdue', protect, getOverdueTasks);

router
  .route('/')
  .get(protect, getTasks)
  .post(protect, authorize('admin'), createTaskValidator, validate, createTask);

router
  .route('/:id')
  .get(protect, getTask)
  .put(protect, updateTaskValidator, validate, updateTask)
  .delete(protect, authorize('admin'), deleteTask);

module.exports = router;
