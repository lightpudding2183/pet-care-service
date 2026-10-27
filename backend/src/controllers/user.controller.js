const userService = require('../services/user.service');
const avatarService = require('../services/avatar.service');
const asyncHandler = require('../utils/asyncHandler');

const getProfile = asyncHandler(async (req, res) => {
  const userProfile = await userService.getProfile(req.user.id);
  res.status(200).json(userProfile);
});

const updateProfile = asyncHandler(async (req, res) => {
  const profile = await userService.updateProfile(req.user.id, req.body);
  res.status(200).json(profile);
});

const changePassword = asyncHandler(async (req, res) => {
  const result = await userService.changePassword(req.user.id, req.body);
  res.status(200).json(result);
});

const createAvatarUploadUrl = asyncHandler(async (req, res) => {
  const result = await avatarService.createUploadUrl(req.user.id, req.body.contentType);
  res.status(200).json(result);
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  createAvatarUploadUrl
};