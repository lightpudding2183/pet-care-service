const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.status(200).json(result);
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user);
  res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = { register, login, logout };
