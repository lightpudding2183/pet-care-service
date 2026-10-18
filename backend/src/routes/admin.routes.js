const express = require('express');
const router = express.Router();

const {
  getUserRole,
  checkUserRole,
  checkAnyRole,
  getActionRequirements,
  verifyResourceAccess
} = require('../controllers/verification.controller');
const requireAuth = require('../middlewares/auth.middleware');

router.get('/my-role', requireAuth, getUserRole);
router.get('/check-role/:role', requireAuth, checkUserRole);
router.get('/check-any-role', requireAuth, checkAnyRole);
router.get('/requirements/:action', requireAuth, getActionRequirements);
router.get('/resource-access/:userId', requireAuth, verifyResourceAccess);

module.exports = router;
