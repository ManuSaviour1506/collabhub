const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini with your API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy-key");

// Get the model (gemini-pro is the standard text model)
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

module.exports = model;