const User = require('../models/User');
const Project = require('../models/Project');

exports.globalSearch = async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json({ users: [], projects: [] });

  try {
    const regex = new RegExp(query, 'i'); 

    const usersPromise = User.find({
      $or: [
        { fullName: { $regex: regex } },
        { username: { $regex: regex } },
        { skillsKnown: { $regex: regex } }
      ]
    }).select('fullName username avatar skillsKnown xp level');

    const projectsPromise = Project.find({
      $or: [
        { title: { $regex: regex } },
        { tags: { $regex: regex } }
      ]
    }).populate('contributors', 'fullName avatar');

    const [users, projects] = await Promise.all([usersPromise, projectsPromise]);
    res.json({ users, projects });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};