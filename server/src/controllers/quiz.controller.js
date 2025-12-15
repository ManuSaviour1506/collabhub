const Question = require('../models/Question');

// @desc    Generate Skill Quiz (Stratified Algorithm)
// @route   POST /api/ai/quiz
exports.generateQuiz = async (req, res) => {
  const { skill } = req.body;

  try {
    // 1. Define the Difficulty Curve (Total 5 questions)
    // Algorithm: 2 Basic -> 2 Intermediate -> 1 Advanced
    const structure = [
      { level: 'basic', count: 2 },
      { level: 'intermediate', count: 2 },
      { level: 'advanced', count: 1 }
    ];

    const quizPromises = structure.map(async (tier) => {
      // MongoDB Aggregation Pipeline for Random Sampling
      return await Question.aggregate([
        { $match: { skill: { $regex: new RegExp(`^${skill}$`, 'i') }, difficulty: tier.level } },
        { $sample: { size: tier.count } }, // Randomly pick 'count' items
        { $project: { _id: 0, question: 1, options: 1, correctAnswer: 1 } } // Hide internal ID
      ]);
    });

    // 2. Execute queries in parallel
    const results = await Promise.all(quizPromises);
    
    // 3. Flatten the array (results comes back as [[basic, basic], [inter, inter], [adv]])
    const quiz = results.flat();

    // 4. Fallback: If DB is empty, return a generic error or dummy questions
    if (quiz.length < 5) {
      return res.json([
        {
          question: `We don't have enough ${skill} questions in the database yet.`,
          options: ["OK", "I will add some", "Retry", "Cancel"],
          correctAnswer: 1
        }
      ]);
    }

    res.json(quiz);

  } catch (error) {
    console.error("Quiz Algorithm Error:", error);
    res.status(500).json({ message: "Algorithm failed to build quiz." });
  }
};