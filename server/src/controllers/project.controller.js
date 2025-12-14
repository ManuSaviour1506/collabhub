const Project = require('../models/Project');
const { addXP } = require('../services/gamification');

// @desc    Add a completed project
// @route   POST /api/projects
exports.addProject = async (req, res) => {
  const { title, description, link, tags, contributorIds } = req.body;

  try {
    // Ensure the creator is included in contributors
    // If contributorIds is undefined, default to just the creator
    const contributors = contributorIds ? [...contributorIds, req.user.id] : [req.user.id];

    const project = await Project.create({
      title,
      description,
      link,
      tags,
      contributors
    });

    // Award XP to all contributors
    contributors.forEach(async (userId) => {
      await addXP(userId, 100); // Massive XP for finishing a project
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my projects
// @route   GET /api/projects/my
exports.getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({ contributors: req.user.id });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single project details (For Kanban Board)
// @route   GET /api/projects/:id
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('contributors', 'username avatar');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a Task to Project
// @route   POST /api/projects/:id/tasks
exports.addTask = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const newTask = {
      title: req.body.title,
      status: 'todo',
      assignedTo: req.user.id
    };

    project.tasks.push(newTask);
    await project.save();
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Task Status (Drag & Drop)
// @route   PUT /api/projects/:id/tasks/:taskId
exports.updateTaskStatus = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const task = project.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.status = req.body.status;
    await project.save();

    // Reward XP for finishing a task
    if (req.body.status === 'done') {
      await addXP(req.user.id, 5); 
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};