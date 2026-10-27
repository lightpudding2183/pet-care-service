const providerService = require('../services/provider.service');
const searchService = require('../services/search.service');
const asyncHandler = require('../utils/asyncHandler');

const getProviderById = asyncHandler(async (req, res) => {
  const provider = await providerService.getProviderById(req.params.id);
  res.status(200).json(provider);
});

const createProvider = asyncHandler(async (req, res) => {
  const newProvider = await providerService.createProvider(req.body, req.user.id);
  res.status(201).json(newProvider);
});

const updateProvider = asyncHandler(async (req, res) => {
  const updatedProvider = await providerService.updateProvider(req.params.id, req.body, req.user.id);
  res.status(200).json(updatedProvider);
});

const searchProviders = asyncHandler(async (req, res) => {
  const result = await searchService.searchProviders(req.query);
  res.status(200).json(result);
});

module.exports = { getProviderById, createProvider, updateProvider, searchProviders };