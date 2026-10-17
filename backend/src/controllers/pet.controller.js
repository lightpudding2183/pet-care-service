const petService = require('../services/pet.service');
const AppError = require('../utils/error');

async function createPet(req, res) {
  try {
    const newPet = await petService.createPet(req.body, req.user.id);
    res.status(201).json(newPet);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function getPetById(req, res) {
  try {
    const pet = await petService.getPetById(req.params.id, req.user.id, req.user.role);
    res.status(200).json(pet);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function getPetList(req, res) {
  try {
    const pets = await petService.getPetList(req.user.id);
    res.status(200).json(pets);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function getPetsByUserId(req, res) {
  try {
    const pets = await petService.getPetsByUserId(
      req.params.userId,
      req.user.id,
      req.user.role
    );
    res.status(200).json(pets);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function updatePet(req, res) {
  try {
    const updatedPet = await petService.updatePet(
      req.params.id,
      req.body,
      req.user.id,
      req.user.role
    );
    res.status(200).json(updatedPet);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function deletePet(req, res) {
  try {
    const result = await petService.deletePet(req.params.id, req.user.id, req.user.role);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = { createPet, getPetList, getPetById, getPetsByUserId, updatePet, deletePet };
