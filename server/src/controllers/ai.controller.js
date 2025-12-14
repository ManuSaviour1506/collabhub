const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini with the newer, faster model
// gemini-1.5-flash is the current standard and avoids the 404 error
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy-key");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// @desc    Generate Roadmap
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

    // Clean up markdown if Gemini adds it
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const roadmap = JSON.parse(text);
    res.json(roadmap);

  } catch (error) {
    console.error("⚠️ Gemini API Error (Roadmap):", error.message);
    
    // SAFE FALLBACK (Prevents 500 Error)
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

// @desc    Chat with AI
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
    
    // SAFE FALLBACK (Prevents 500 Error)
    res.json({ 
      reply: "I am having trouble connecting to Google Gemini right now (Invalid API Key or Quota exceeded). But keep learning! You're doing great!" 
    });
  }
};