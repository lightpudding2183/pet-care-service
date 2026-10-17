const providerService = require('../services/provider.service');
const AppError = require('../utils/error');

async function getProviderById(req, res) {
  try {
    const providerId = req.params.id;
    const provider = await providerService.getProviderById(providerId);
    res.status(200).json(provider); 
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message })
    } else {
    res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function createProvider(req, res) {
  try {
    const providerData = req.body;
    const userId = req.user.id;
    const newProvider = await providerService.createProvider(providerData, userId);
    res.status(201).json(newProvider)
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function updateProvider(req, res) {
  try {
    const providerId = req.params.id;
    const updateData = req.body;
    const updatedProvider = await providerService.updateProvider(providerId, updateData, req.user.id);
    res.status(200).json(updatedProvider);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = { getProviderById, createProvider, updateProvider };