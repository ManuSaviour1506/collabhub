const express = require('express');
const router = express.Router();
const { 
  addProject, 
  getMyProjects, 
  getProjectById, 
  addTask, 
  updateTaskStatus 
} = require('../controllers/project.controller');
const { protect } = require('../middleware/auth.middleware');

// Portfolio Routes
router.post('/', protect, addProject);
router.get('/my', protect, getMyProjects);

// Kanban Board Routes
router.get('/:id', protect, getProjectById);
router.post('/:id/tasks', protect, addTask);
router.put('/:id/tasks/:taskId', protect, updateTaskStatus);

module.exports = router;