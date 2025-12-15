const mongoose = require("mongoose");
const Question = require("./models/Question");
require("dotenv").config();

const questions = [
  {
    skill: "React",
    question: "What is JSX?",
    options: ["JavaScript XML", "Java Syntax", "JSON", "Library"],
    correctAnswer: 0
  },
  {
    skill: "React",
    question: "Which hook manages state?",
    options: ["useEffect", "useState", "useRef", "useMemo"],
    correctAnswer: 1
  },
  {
    skill: "Python",
    question: "Which keyword defines a function?",
    options: ["func", "define", "def", "function"],
    correctAnswer: 2
  },
  {
    skill: "Node",
    question: "What is Node.js?",
    options: ["Framework", "Runtime", "Database", "Browser"],
    correctAnswer: 1
  }
];

async function seedDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Question.insertMany(questions);
    console.log("✅ Questions inserted successfully");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedDB();
