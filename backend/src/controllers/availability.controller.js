const availabilityService = require('../services/availability.service');
const asyncHandler = require('../utils/asyncHandler');

const getAvailability = asyncHandler(async (req, res) => {
  const availability = await availabilityService.getAvailabilityByProviderId(req.params.id, req.user.id);
  res.status(200).json(availability);
});

const updateAvailability = asyncHandler(async (req, res) => {
  const updatedAvailability = await availabilityService.updateAvailability(req.params.id, req.body, req.user.id);
  res.status(200).json(updatedAvailability);
});

const deleteAvailability = asyncHandler(async (req, res) => {
  const deletedAvailability = await availabilityService.deleteAvailability(req.params.id, req.user.id);
  res.status(200).json(deletedAvailability);
});

module.exports = { getAvailability, updateAvailability, deleteAvailability };