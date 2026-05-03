const express = require('express');
const {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  addMember,
  removeMember,
  updateMemberRole,
} = require('../controllers/teamController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const router = express.Router();

router
  .route('/')
  .get(protect, getTeams)
  .post(protect, authorize('admin'), createTeam);

router
  .route('/:id')
  .get(protect, getTeam)
  .put(protect, authorize('admin'), updateTeam);

router
  .route('/:id/members')
  .post(protect, authorize('admin'), addMember);

router
  .route('/:id/members/:userId')
  .delete(protect, authorize('admin'), removeMember);

router
  .route('/:id/members/:userId/role')
  .put(protect, authorize('admin'), updateMemberRole);

module.exports = router;
