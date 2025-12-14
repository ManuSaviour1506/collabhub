const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  status: { type: String, enum: ['todo', 'doing', 'done'], default: 'todo' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Optional: who is doing it?
});

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  contributors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  link: { type: String }, 
  tags: [{ type: String }], 
  verified: { type: Boolean, default: false },
  
  // NEW: Task Board
  tasks: [taskSchema]
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);