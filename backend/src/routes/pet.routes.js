const express = require('express');
const router = express.Router();

const { createPet, getPetList, getPetById, getPetsByUserId, updatePet, deletePet } = require('../controllers/pet.controller');
const requireAuth = require('../middlewares/auth.middleware');

router.post('/', requireAuth, createPet);
router.get('/', requireAuth, getPetList);
router.get('/:id', requireAuth, getPetById);
router.get('/users/:userId/pets', requireAuth, getPetsByUserId);
router.put('/:id', requireAuth, updatePet);
router.delete('/:id', requireAuth, deletePet);

module.exports = router;