const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  status: { type: String, enum: ['todo', 'doing', 'done'], default: 'todo' }
});

const projectSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  link: { type: String },
  tags: [String],
  tasks: [taskSchema] // Array of tasks
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);