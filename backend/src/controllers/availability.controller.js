const availabilityService = require('../services/availability.service');
const AppError = require('../utils/error');

async function getAvailability(req, res) {
  try {
    const providerId = req.params.id;
    const availability = await availabilityService.getAvailabilityByProviderId(providerId, req.user.id);
    res.status(200).json(availability);
  } catch (error) {
    if(error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function updateAvailability(req, res) {
  try {
    const providerId = req.params.id;
    const availabilityData = req.body;
    const updatedAvailability = await availabilityService.updateAvailability(providerId, availabilityData, req.user.id);
    res.status(200).json(updatedAvailability);
  } catch (error) {
    if(error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function deleteAvailability(req, res) {
  try {
    const providerId = req.params.id;
    const deletedAvailability = await availabilityService.deleteAvailability(providerId, req.user.id);
    res.status(200).json(deletedAvailability);
  } catch (error) {
    if(error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = { getAvailability, updateAvailability, deleteAvailability };