// Point to the modules installed in the 'server' folder
const mongoose = require('./server/node_modules/mongoose'); 
const dotenv = require('./server/node_modules/dotenv');
const Question = require('./server/src/models/Question');

// Load environment variables from the server folder
dotenv.config({ path: './server/.env' });

const questions = [
  // --- REACT (Basic) ---
  { skill: 'React', difficulty: 'basic', question: 'What is a Component in React?', options: ['A function that returns HTML', 'A database', 'A styling file', 'A server'], correctAnswer: 0 },
  { skill: 'React', difficulty: 'basic', question: 'Which hook manages state?', options: ['useEffect', 'useState', 'useContext', 'useReducer'], correctAnswer: 1 },
  { skill: 'React', difficulty: 'basic', question: 'What is JSX?', options: ['JavaScript XML', 'Java Syntax', 'JSON X', 'External Library'], correctAnswer: 0 },
  
  // --- REACT (Intermediate) ---
  { skill: 'React', difficulty: 'intermediate', question: 'What triggers a re-render?', options: ['Comments', 'State or Props change', 'Mouse movement', 'API calls only'], correctAnswer: 1 },
  { skill: 'React', difficulty: 'intermediate', question: 'What is the Virtual DOM?', options: ['A virus', 'A direct copy of HTML', 'Lightweight copy of DOM', 'Browser API'], correctAnswer: 2 },
  
  // --- REACT (Advanced) ---
  { skill: 'React', difficulty: 'advanced', question: 'What prevents unnecessary re-renders?', options: ['useState', 'useEffect', 'useMemo', 'useContext'], correctAnswer: 2 },
  { skill: 'React', difficulty: 'advanced', question: 'How does React handle reconciliation?', options: ['DFS Algorithm', 'Diffing Algorithm', 'Random selection', 'Queue system'], correctAnswer: 1 },

  // --- NODE.JS (Basic) ---
  { skill: 'Node.js', difficulty: 'basic', question: 'What is Node.js?', options: ['A Framework', 'A Runtime Environment', 'A Database', 'A Browser'], correctAnswer: 1 },
  { skill: 'Node.js', difficulty: 'basic', question: 'Which command initializes a project?', options: ['npm start', 'node init', 'npm init', 'git init'], correctAnswer: 2 },

  // --- NODE.JS (Intermediate) ---
  { skill: 'Node.js', difficulty: 'intermediate', question: 'What is the Event Loop?', options: ['A loop that never ends', 'Handles asynchronous callbacks', 'Connects to DB', 'Parses JSON'], correctAnswer: 1 },

  // --- NODE.JS (Advanced) ---
  { skill: 'Node.js', difficulty: 'advanced', question: 'What is the use of Buffer class?', options: ['Caching data', 'Handling binary data', 'Buffering video', 'Speeding up code'], correctAnswer: 1 },
  
  // --- PYTHON (Basic) ---
  { skill: 'Python', difficulty: 'basic', question: 'How do you output text to the console?', options: ['console.log()', 'print()', 'echo', 'write()'], correctAnswer: 1 },
  { skill: 'Python', difficulty: 'basic', question: 'Which keyword defines a function?', options: ['func', 'def', 'function', 'definition'], correctAnswer: 1 },

  // --- PYTHON (Intermediate) ---
  { skill: 'Python', difficulty: 'intermediate', question: 'What data type is immutable?', options: ['List', 'Dictionary', 'Set', 'Tuple'], correctAnswer: 3 },
  
  // --- PYTHON (Advanced) ---
  { skill: 'Python', difficulty: 'advanced', question: 'What is a decorator?', options: ['A styling tool', 'A function that modifies another function', 'A class inheritance', 'A variable type'], correctAnswer: 1 }
];

const seedDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing. Check your .env file path.");
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Clear old questions to avoid duplicates
    await Question.deleteMany({});
    console.log('Old questions removed');

    // Insert new ones
    await Question.insertMany(questions);
    console.log('Questions Seeded Successfully!');
    
    process.exit();
  } catch (error) {
    console.error("Seeding Error:", error.message);
    process.exit(1);
  }
};

seedDB();