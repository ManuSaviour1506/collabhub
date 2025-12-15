const mongoose = require('mongoose');

// --- 1. TASK SUB-SCHEMA ---
// Defines the structure for individual Kanban tasks
const taskSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['todo', 'doing', 'done'], 
    default: 'todo' 
  },
  assignedTo: { // Optional: who is responsible for the task
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  } 
});

// --- 2. PROJECT MAIN SCHEMA ---
const projectSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  contributors: [{ // Array of User IDs involved in the project
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  link: { 
    type: String 
  }, 
  tags: [{ 
    type: String 
  }], 
  verified: { // Optional field for future features
    type: Boolean, 
    default: false 
  },
  
  // NEW: Task Board (Array of taskSchema documents)
  tasks: [taskSchema]
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);