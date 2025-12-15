const express = require('express');
const router = express.Router();
const { 
  addProject, 
  getMyProjects, 
  getProjectById, 
  addTask, 
  updateTaskStatus,
  generateTasksAI // <-- Includes the AI Planner function
} = require('../controllers/project.controller');
const { protect } = require('../middleware/auth.middleware');

// --- 1. Main Project Portfolio Routes ---

// POST /api/projects/ - Create a new project (using addProject)
// GET /api/projects/my - Fetch all projects for the current user
router.route('/')
  .post(protect, addProject)
  .get(protect, getMyProjects);

router.route('/my')
  .get(protect, getMyProjects);

// --- 2. Kanban Board and Task Management Routes ---

// GET /api/projects/:id - Get a single project (to load the board)
router.get('/:id', protect, getProjectById);

// POST /api/projects/:id/tasks - Add a manual task
router.post('/:id/tasks', protect, addTask);

// POST /api/projects/:id/generate-tasks - AI: Trigger task generation
router.post('/:id/generate-tasks', protect, generateTasksAI);

// PUT /api/projects/:id/tasks/status - Update Task Status (from To Do -> Doing -> Done)
// The taskId and new status are passed in the request body.
router.put('/:id/tasks/status', protect, updateTaskStatus);

module.exports = router;