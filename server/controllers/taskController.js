const Task = require('../models/Task');
const Project = require('../models/Project');
const ApiError = require('../utils/ApiError');

// @desc    Get all tasks (with filters)
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    const { status, priority, project, assignee, search } = req.query;

    const filter = {};

    // Admin sees all tasks from their projects, member sees assigned tasks
    if (req.user.role === 'admin') {
      const projects = await Project.find({ owner: req.user._id }).select('_id');
      filter.project = { $in: projects.map((p) => p._id) };
    } else {
      filter.assignee = req.user._id;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (project) filter.project = project;
    if (assignee) filter.assignee = assignee;
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name')
      .populate('project', 'name color')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name color');

    if (!task) {
      throw new ApiError(404, 'Task not found');
    }

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private/Admin
const createTask = async (req, res, next) => {
  try {
    const { title, description, project, assignee, priority, dueDate, tags } = req.body;

    // Verify project exists
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      throw new ApiError(404, 'Project not found');
    }

    const task = await Task.create({
      title,
      description,
      project,
      assignee,
      priority,
      dueDate,
      tags,
      createdBy: req.user._id,
    });

    const populated = await Task.findById(task._id)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name')
      .populate('project', 'name color');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private (Admin: all fields, Member: status only on own tasks)
const updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      throw new ApiError(404, 'Task not found');
    }

    // Members can only update status of their own tasks
    if (req.user.role === 'member') {
      if (task.assignee?.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'You can only update tasks assigned to you');
      }
      // Only allow status update for members
      const allowedFields = ['status'];
      const updateFields = Object.keys(req.body);
      const isValid = updateFields.every((field) => allowedFields.includes(field));
      if (!isValid) {
        throw new ApiError(403, 'Members can only update task status');
      }
    }

    task = await Task.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    )
      .populate('assignee', 'name email')
      .populate('createdBy', 'name')
      .populate('project', 'name color');

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      throw new ApiError(404, 'Task not found');
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get overdue tasks
// @route   GET /api/tasks/overdue
// @access  Private
const getOverdueTasks = async (req, res, next) => {
  try {
    const filter = {
      dueDate: { $lt: new Date() },
      status: { $ne: 'completed' },
    };

    if (req.user.role === 'admin') {
      const projects = await Project.find({ owner: req.user._id }).select('_id');
      filter.project = { $in: projects.map((p) => p._id) };
    } else {
      filter.assignee = req.user._id;
    }

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email')
      .populate('project', 'name color')
      .sort({ dueDate: 1 });

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    next(error);
  }
};

// @desc    Get task statistics
// @route   GET /api/tasks/stats
// @access  Private
const getTaskStats = async (req, res, next) => {
  try {
    let matchFilter = {};

    if (req.user.role === 'admin') {
      const projects = await Project.find({ owner: req.user._id }).select('_id');
      matchFilter.project = { $in: projects.map((p) => p._id) };
    } else {
      matchFilter.assignee = req.user._id;
    }

    const stats = await Task.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          todo: { $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          review: { $sum: { $cond: [{ $eq: ['$status', 'review'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$status', 'completed'] },
                    { $lt: ['$dueDate', new Date()] },
                    { $ne: ['$dueDate', null] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const defaultStats = {
      total: 0,
      todo: 0,
      inProgress: 0,
      review: 0,
      completed: 0,
      overdue: 0,
    };

    // Priority breakdown
    const priorityStats = await Task.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        ...(stats[0] || defaultStats),
        priorities: priorityStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getOverdueTasks,
  getTaskStats,
};
