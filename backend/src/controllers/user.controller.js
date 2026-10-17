const userService = require('../services/user.service');
const AppError = require('../utils/error');

async function getProfile(req, res) {
  try {
    const userId = req.user.id;
    const userProfile = await userService.getProfile(userId);
    res.status(200).json(userProfile);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const updatedData = req.body;
    await userService.updateProfile(userId, updatedData);
    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
    res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = {
  getProfile,
  updateProfile
};