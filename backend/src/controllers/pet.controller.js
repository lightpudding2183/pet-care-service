const petService = require('../services/pet.service');
const asyncHandler = require('../utils/asyncHandler');

const createPet = asyncHandler(async (req, res) => {
  const newPet = await petService.createPet(req.body, req.user.id);
  res.status(201).json(newPet);
});

const getPetById = asyncHandler(async (req, res) => {
  const pet = await petService.getPetById(req.params.id, req.user.id, req.user.role);
  res.status(200).json(pet);
});

const getPetList = asyncHandler(async (req, res) => {
  const pets = await petService.getPetList(req.user.id);
  res.status(200).json(pets);
});

const getPetsByUserId = asyncHandler(async (req, res) => {
  const pets = await petService.getPetsByUserId(req.params.userId, req.user.id, req.user.role);
  res.status(200).json(pets);
});

const updatePet = asyncHandler(async (req, res) => {
  const updatedPet = await petService.updatePet(req.params.id, req.body, req.user.id, req.user.role);
  res.status(200).json(updatedPet);
});

const deletePet = asyncHandler(async (req, res) => {
  const result = await petService.deletePet(req.params.id, req.user.id, req.user.role);
  res.status(200).json(result);
});

module.exports = { createPet, getPetList, getPetById, getPetsByUserId, updatePet, deletePet };
