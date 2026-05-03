const express = require('express');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { createProjectValidator, updateProjectValidator } = require('../validators/projectValidator');
const validate = require('../middleware/validate');

const router = express.Router();

router
  .route('/')
  .get(protect, getProjects)
  .post(protect, authorize('admin'), createProjectValidator, validate, createProject);

router
  .route('/:id')
  .get(protect, getProject)
  .put(protect, authorize('admin'), updateProjectValidator, validate, updateProject)
  .delete(protect, authorize('admin'), deleteProject);

module.exports = router;
