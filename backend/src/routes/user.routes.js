const express = require('express');
const router = express.Router();

const { getProfile, updateProfile } = require('../controllers/user.controller');
const requireAuth = require('../middlewares/auth.middleware');
const validateBody = require('../middlewares/validate');

router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);

module.exports = router;