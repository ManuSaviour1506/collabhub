const { GoogleGenerativeAI } = require("@google/generative-ai");
const { spawn } = require('child_process');
const path = require('path');
const User = require('../models/User'); 
const Question = require('../models/Question'); // <-- NEW: Required for Quiz Logic

// --- 1. SETUP GEMINI AI ---
const GEMINI_MODEL_NAME = "gemini-2.5-flash"; // Updated model name for better availability/access
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy-key");

// --- 2. CONTROLLER FUNCTIONS ---

// @desc    Generate Roadmap (Uses Gemini AI)
// @route   POST /api/ai/roadmap
exports.generateRoadmap = async (req, res) => {
  const { skill } = req.body;

  try {
    const modelInstance = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });

    const prompt = `Create a step-by-step learning roadmap for a beginner wanting to learn ${skill}. 
    Return strictly a JSON object with this structure:
    {
      "title": "Mastering ${skill}",
      "steps": [
        { "topic": "Step Name", "description": "What to learn" }
      ]
    }
    Do not include markdown ticks like \`\`\`json. Just the raw JSON string.`;

    const result = await modelInstance.generateContent(prompt);
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
    const modelInstance = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME }); // Use updated model

    const prompt = `You are an expert tutor helping a student learn ${context || 'general skills'}. 
    Keep your answer concise (under 3 sentences) and encouraging.
    
    Student's Question: "${message}"`;

    const result = await modelInstance.generateContent(prompt);
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

// @desc    Generate Skill Quiz (Uses pure Node.js/MongoDB Aggregation)
// @route   POST /api/ai/quiz
exports.generateQuiz = async (req, res) => {
  const { skill } = req.body;

  try {
    // 1. Define the Difficulty Curve (Total 5 questions)
    const structure = [
      { level: 'basic', count: 2 },
      { level: 'intermediate', count: 2 },
      { level: 'advanced', count: 1 }
    ];

    const quizPromises = structure.map(async (tier) => {
      // MongoDB Aggregation Pipeline for Random Sampling
      return await Question.aggregate([
        // Ensure case-insensitive match for the skill
        { $match: { skill: { $regex: new RegExp(`^${skill}$`, 'i') }, difficulty: tier.level } },
        { $sample: { size: tier.count } }, 
        // Project to frontend-friendly keys: q, o, a
        { $project: { _id: 0, q: "$question", o: "$options", a: "$correctAnswer" } }
      ]);
    });

    // 2. Execute queries in parallel
    const results = await Promise.all(quizPromises);
    
    // 3. Flatten the array and shuffle it
    const quiz = results.flat();
    quiz.sort(() => Math.random() - 0.5);

    // 4. Fallback: If DB has fewer than 5 questions
    if (quiz.length < 5) {
      return res.json([
        {
          q: `We only found ${quiz.length} question(s) for ${skill}.`,
          o: ["OK", "I will add some", "Retry", "Cancel"],
          a: 0 
        }
      ].concat(quiz));
    }

    res.json(quiz);

  } catch (error) {
    console.error("Quiz Algorithm Error:", error);
    res.status(500).json({ message: "Algorithm failed to build quiz." });
  }
};

// @desc    Semantic Search for Mentors (Uses Python ML Engine + Vector Embeddings)
// @route   POST /api/ai/match
exports.semanticMatch = async (req, res) => {
  const { query } = req.body; 

  if (!query) {
    return res.status(400).json({ message: "Query is required" });
  }

  try {
    // 1. Fetch All Potential Mentors (exclude self)
    const candidates = await User.find({ _id: { $ne: req.user.id } })
      .select('fullName username avatar bio skillsKnown level xp');

    // 2. Prepare Data for Python
    const candidatesJSON = JSON.stringify(candidates);

    // 3. Spawn Python process
    const scriptPath = path.join(__dirname, '../../../ml_engine.py');
    const pythonCommand = process.platform === "win32" ? "python" : "python3";
    
    const pythonProcess = spawn(pythonCommand, [
      scriptPath, 
      'match',           // Mode
      query,             // User Query (passed via CLI argument)
    ], { timeout: 15000 }); // Added robust timeout

    // CRITICAL: Pipe the large data chunk to stdin
    pythonProcess.stdin.write(candidatesJSON);
    pythonProcess.stdin.end();

    let dataString = '';

    // Handle standard output
    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    // Handle standard error (for debugging Python crashes)
    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python Error (stderr): ${data}`);
    });

    // Handle process close
    pythonProcess.on('close', (code) => {
      try {
        // Attempt to parse the final JSON output
        const results = JSON.parse(dataString);
        
        if (code !== 0 || results.error) {
          console.error(`Python script exited with code ${code}. Output: ${dataString}`);
          return res.status(500).json({ message: results.error || "AI Engine Failed (Non-JSON output or crash)." });
        }
        
        res.json(results);
      } catch (err) {
        console.error("Failed to parse Python results (Check Python output):", err);
        res.status(500).json({ message: "AI Engine Failed (Invalid JSON format)." });
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};