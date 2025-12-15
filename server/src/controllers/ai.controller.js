const { GoogleGenerativeAI } = require("@google/generative-ai");
const { spawn } = require('child_process');
const path = require('path');
const User = require('../models/User'); // Required for Semantic Search

// --- 1. SETUP GEMINI AI ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy-key");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- 2. CONTROLLER FUNCTIONS ---

// @desc    Generate Roadmap (Uses Gemini AI)
// @route   POST /api/ai/roadmap
exports.generateRoadmap = async (req, res) => {
  const { skill } = req.body;

  try {
    const prompt = `Create a step-by-step learning roadmap for a beginner wanting to learn ${skill}. 
    Return strictly a JSON object with this structure:
    {
      "title": "Mastering ${skill}",
      "steps": [
        { "topic": "Step Name", "description": "What to learn" }
      ]
    }
    Do not include markdown ticks like \`\`\`json. Just the raw JSON string.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const roadmap = JSON.parse(text);
    res.json(roadmap);

  } catch (error) {
    console.error("⚠️ Gemini API Error (Roadmap):", error.message);
    res.json({
      title: `Roadmap for ${skill} (Offline Mode)`,
      steps: [
        { topic: "Basics", description: "Learn the core syntax and concepts." },
        { topic: "Intermediate Projects", description: "Build 3 small projects to practice." },
        { topic: "Advanced Concepts", description: "Deep dive into memory management." },
        { topic: "Final Project", description: "Build a full-stack application." }
      ]
    });
  }
};

// @desc    Chat with AI Tutor (Uses Gemini AI)
// @route   POST /api/ai/chat
exports.chatWithAI = async (req, res) => {
  const { message, context } = req.body;

  try {
    const prompt = `You are an expert tutor helping a student learn ${context || 'general skills'}. 
    Keep your answer concise (under 3 sentences) and encouraging.
    
    Student's Question: "${message}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error("⚠️ Gemini API Error (Chat):", error.message);
    res.json({ 
      reply: "I am having trouble connecting to Google Gemini right now. But keep learning! You're doing great!" 
    });
  }
};

// @desc    Generate Skill Quiz (Uses Python ML Engine)
// @route   POST /api/ai/quiz
exports.generateQuiz = async (req, res) => {
  const { skill } = req.body;

  try {
    // We now use 'ml_engine.py' for everything
    const scriptPath = path.join(__dirname, '../../../ml_engine.py');
    
    // Spawn Python: python ml_engine.py quiz <skill>
    const pythonProcess = spawn('python', [scriptPath, 'quiz', skill]);

    let dataString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python script exited with code ${code}`);
        return res.status(500).json({ message: "Python script failed." });
      }
      try {
        const quiz = JSON.parse(dataString);
        if (quiz.error) return res.status(400).json({ message: quiz.error });
        res.json(quiz);
      } catch (e) {
        console.error("JSON Parse Error:", e);
        res.status(500).json({ message: "Failed to parse quiz data." });
      }
    });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Server failed to run quiz engine." });
  }
};

// @desc    Semantic Search for Mentors (Uses Python ML Engine + Vector Embeddings)
// @route   POST /api/ai/match
exports.semanticMatch = async (req, res) => {
  const { query } = req.body; // e.g., "I need help building a drone"

  if (!query) {
    return res.status(400).json({ message: "Query is required" });
  }

  

  try {
    // 1. Fetch All Potential Mentors (exclude self)
    // We select fields that give the AI context about the user
    const candidates = await User.find({ _id: { $ne: req.user.id } })
      .select('fullName username avatar bio skillsKnown level xp');

    // 2. Prepare Data for Python
    const candidatesJSON = JSON.stringify(candidates);

    // 3. Spawn Python: python ml_engine.py match <query> <candidatesJSON>
    const scriptPath = path.join(__dirname, '../../../ml_engine.py');
    
    const pythonProcess = spawn('python', [
      scriptPath, 
      'match',           // Mode
      query,             // User Query
      candidatesJSON     // List of users
    ]);

    let dataString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python Error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      try {
        const results = JSON.parse(dataString);
        if (results.error) {
          return res.status(500).json({ message: results.error });
        }
        res.json(results);
      } catch (err) {
        console.error("Failed to parse Python results", err);
        res.status(500).json({ message: "AI Engine Failed" });
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};