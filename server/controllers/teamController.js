const Team = require('../models/Team');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

// @desc    Get all teams for the authenticated user
// @route   GET /api/teams
// @access  Private
const getTeams = async (req, res, next) => {
  try {
    let teams;
    if (req.user.role === 'admin') {
      teams = await Team.find({ owner: req.user._id })
        .populate('owner', 'name email')
        .populate('members.user', 'name email role')
        .sort({ createdAt: -1 });
    } else {
      teams = await Team.find({ 'members.user': req.user._id })
        .populate('owner', 'name email')
        .populate('members.user', 'name email role')
        .sort({ createdAt: -1 });
    }

    res.json({ success: true, data: teams });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single team by ID
// @route   GET /api/teams/:id
// @access  Private
const getTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email role');

    if (!team) {
      throw new ApiError(404, 'Team not found');
    }

    res.json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private/Admin
const createTeam = async (req, res, next) => {
  try {
    const { name } = req.body;

    const team = await Team.create({
      name,
      owner: req.user._id,
    });

    const populated = await Team.findById(team._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email role');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private/Admin
const updateTeam = async (req, res, next) => {
  try {
    let team = await Team.findById(req.params.id);

    if (!team) {
      throw new ApiError(404, 'Team not found');
    }

    if (team.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Only the team owner can update this team');
    }

    team = await Team.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name },
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email')
      .populate('members.user', 'name email role');

    res.json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to team
// @route   POST /api/teams/:id/members
// @access  Private/Admin
const addMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;

    const team = await Team.findById(req.params.id);
    if (!team) {
      throw new ApiError(404, 'Team not found');
    }

    if (team.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Only the team owner can add members');
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(404, 'User with this email not found. They must register first.');
    }

    // Check if already a member
    const isMember = team.members.some(
      (m) => m.user.toString() === user._id.toString()
    );
    if (isMember) {
      throw new ApiError(400, 'User is already a member of this team');
    }

    team.members.push({ user: user._id, role: role || 'member' });
    await team.save();

    const populated = await Team.findById(team._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email role');

    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from team
// @route   DELETE /api/teams/:id/members/:userId
// @access  Private/Admin
const removeMember = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      throw new ApiError(404, 'Team not found');
    }

    if (team.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Only the team owner can remove members');
    }

    // Can't remove the owner
    if (req.params.userId === team.owner.toString()) {
      throw new ApiError(400, 'Cannot remove the team owner');
    }

    team.members = team.members.filter(
      (m) => m.user.toString() !== req.params.userId
    );
    await team.save();

    const populated = await Team.findById(team._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email role');

    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update member role
// @route   PUT /api/teams/:id/members/:userId/role
// @access  Private/Admin
const updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['admin', 'member'].includes(role)) {
      throw new ApiError(400, 'Role must be admin or member');
    }

    const team = await Team.findById(req.params.id);
    if (!team) {
      throw new ApiError(404, 'Team not found');
    }

    if (team.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Only the team owner can change roles');
    }

    const member = team.members.find(
      (m) => m.user.toString() === req.params.userId
    );
    if (!member) {
      throw new ApiError(404, 'Member not found in this team');
    }

    member.role = role;
    await team.save();

    const populated = await Team.findById(team._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email role');

    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  addMember,
  removeMember,
  updateMemberRole,
};
