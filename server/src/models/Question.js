const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  skill: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    validate: v => v.length === 4
  },
  correctAnswer: {
    type: Number,
    min: 0,
    max: 3
  }
});

module.exports = mongoose.model("Question", questionSchema);
