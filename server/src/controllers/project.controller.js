const Project = require('../models/Project');
const { addXP } = require('../services/gamification');
const { spawn } = require('child_process');
const path = require('path');

// ==========================================
// 1. PROJECT CREATION & FETCHING
// ==========================================

// @desc    Add a completed project
// @route   POST /api/projects
exports.addProject = async (req, res) => {
  const { title, description, link, tags, contributorIds } = req.body;

  try {
    // Ensure the creator is included in contributors
    const contributors = contributorIds ? [...new Set(contributorIds), req.user.id] : [req.user.id];

    const project = await Project.create({
      title,
      description,
      link,
      tags,
      contributors,
    });

    // Award XP to all contributors for project creation (100 XP)
    contributors.forEach(async (userId) => {
      await addXP(userId, 100); 
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
    const projects = await Project.find({ contributors: req.user.id }).populate('contributors', 'username avatar');
    res.json(projects);
  } catch (error) {
    console.error("Error in getMyProjects:", error);
    res.status(500).json({ message: "Failed to fetch projects. Check model/data consistency." });
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

// ==========================================
// 2. TASK & KANBAN MANAGEMENT
// ==========================================

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
// @route   PUT /api/projects/:id/tasks/status
exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId, status } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Use .id() method on the Mongoose sub-document array
    const task = project.tasks.id(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Check if status is changing to 'done' (to award XP only once)
    const statusChangedToDone = (task.status !== 'done' && status === 'done');

    task.status = status;
    await project.save();

    // Reward XP for finishing a task (5 XP)
    if (statusChangedToDone) {
      await addXP(req.user.id, 5); 
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 3. AI GENERATION (Python ML Engine)
// ==========================================

// @desc    AI: Generate Tasks based on project description
// @route   POST /api/projects/:id/generate-tasks
exports.generateTasksAI = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    const pythonCommand = process.platform === "win32" ? "python" : "python3";
    const scriptPath = path.join(__dirname, '../../../ml_engine.py');
    
    // Spawn Python Process to run the 'plan_project' mode
    const pythonProcess = spawn(pythonCommand, [ 
      scriptPath, 
      'plan_project', 
      project.description 
    ]);

    let dataString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python Logic Error: ${data}`);
    });

    pythonProcess.on('close', async (code) => {
      try {
        if (code !== 0) throw new Error("Python script exited with error code: " + code);

        const generatedTasks = JSON.parse(dataString);
        
        // Add tasks to the project document
        let count = 0;
        generatedTasks.forEach(t => {
           // Prevent duplicates by checking existing task titles
           if (!project.tasks.some(pt => pt.title === t)) {
             project.tasks.push({ title: t, status: 'todo', assignedTo: req.user.id });
             count++;
           }
        });
        
        const updatedProject = await project.save();
        // Send back the whole updated project to the frontend
        res.json({ project: updatedProject, message: `Generated ${count} tasks` });

      } catch (e) {
        console.error("AI Plan Error (Node Side):", e);
        console.error("Raw Python Output:", dataString);
        res.status(500).json({ message: "Failed to generate plan. Check Python output for errors." });
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};