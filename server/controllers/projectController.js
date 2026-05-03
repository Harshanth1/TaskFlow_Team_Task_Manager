const Project = require('../models/Project');
const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');

// @desc    Get all projects for the authenticated user
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
  try {
    let projects;
    if (req.user.role === 'admin') {
      // Admin sees all projects they own
      projects = await Project.find({ owner: req.user._id })
        .populate('owner', 'name email')
        .populate('team', 'name')
        .sort({ createdAt: -1 });
    } else {
      // Members see projects from teams they belong to
      const Team = require('../models/Team');
      const teams = await Team.find({ 'members.user': req.user._id });
      const teamIds = teams.map((t) => t._id);
      projects = await Project.find({ team: { $in: teamIds } })
        .populate('owner', 'name email')
        .populate('team', 'name')
        .sort({ createdAt: -1 });
    }

    // Get task counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCounts = await Task.aggregate([
          { $match: { project: project._id } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]);

        const counts = {
          total: 0,
          todo: 0,
          'in-progress': 0,
          review: 0,
          completed: 0,
        };

        taskCounts.forEach((tc) => {
          counts[tc._id] = tc.count;
          counts.total += tc.count;
        });

        return {
          ...project.toObject(),
          taskCounts: counts,
        };
      })
    );

    res.json({ success: true, data: projectsWithCounts });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('team', 'name members');

    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    // Get tasks for this project
    const tasks = await Task.find({ project: project._id })
      .populate('assignee', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { ...project.toObject(), tasks },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private/Admin
const createProject = async (req, res, next) => {
  try {
    const { name, description, deadline, team, color } = req.body;

    const project = await Project.create({
      name,
      description,
      deadline,
      team,
      color,
      owner: req.user._id,
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('team', 'name');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private/Admin
const updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    // Only owner can update
    if (project.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Only the project owner can update this project');
    }

    project = await Project.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email')
      .populate('team', 'name');

    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Only the project owner can delete this project');
    }

    // Delete all tasks associated with this project
    await Task.deleteMany({ project: project._id });

    await Project.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject };
