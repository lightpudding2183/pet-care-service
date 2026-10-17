const express = require('express');
const router = express.Router();

const { getProviderById, createProvider, updateProvider } = require('../controllers/provider.controller');
const { getAvailability, updateAvailability, deleteAvailability } = require('../controllers/availability.controller');
const requireAuth = require('../middlewares/auth.middleware');
const validateBody = require('../middlewares/validate');
const {
  createProviderSchema,
  updateProviderSchema,
  availabilitySchema
} = require('../validators/provider.validator');

router.get('/:id', requireAuth, getProviderById);
router.post('/', requireAuth, validateBody(createProviderSchema), createProvider);
router.put('/:id', requireAuth, validateBody(updateProviderSchema), updateProvider);
router.get('/:id/availability', requireAuth, getAvailability);
router.put('/:id/availability', requireAuth, validateBody(availabilitySchema), updateAvailability);
router.delete('/:id/availability', requireAuth, deleteAvailability);

module.exports = router;