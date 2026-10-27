const express = require('express');
const router = express.Router();

const { getProfile, updateProfile, changePassword, createAvatarUploadUrl } = require('../controllers/user.controller');
const requireAuth = require('../middlewares/auth.middleware');
const validateBody = require('../middlewares/validate');
const { updateProfileSchema, changePasswordSchema, avatarUploadSchema } = require('../validators/user.validator');

router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, validateBody(updateProfileSchema), updateProfile);
router.post('/change-password', requireAuth, validateBody(changePasswordSchema), changePassword);
router.post('/avatar-upload-url', requireAuth, validateBody(avatarUploadSchema), createAvatarUploadUrl);

module.exports = router;