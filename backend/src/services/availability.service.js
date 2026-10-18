const AppError = require('../utils/error');
const { Provider, Availability } = require('../index');

class AvailabilityService {
  async getAvailabilityByProviderId(providerId, userId) {
    try {
      const provider = await Provider.findByPk(providerId);
      if (!provider) {
        throw new AppError('Provider not found', 404);
      }

      if (userId && provider.user_id !== userId) {
        throw new AppError('Forbidden: you do not own this provider availability', 403);
      }

      const availability = await Availability.findAll({
        where: { provider_id: providerId },
        order: [['date', 'ASC'], ['start_time', 'ASC']]
      });

      return availability;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Error fetching availability', 500, { cause: error });
    }
  }

  async updateAvailability(providerId, availabilityData, userId) {
    try {
      const provider = await Provider.findByPk(providerId);
      if (!provider) {
        throw new AppError('Provider not found', 404);
      }

      if (provider.user_id !== userId) {
        throw new AppError('Forbidden: you do not own this provider availability', 403);
      }

      const payload = {
        ...availabilityData,
        provider_id: providerId
      };

      const [availabilityRecord, created] = await Availability.findOrCreate({
        where: { provider_id: providerId },
        defaults: payload
      });

      if (!created) {
        await availabilityRecord.update(payload);
      }

      return availabilityRecord;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Error updating availability', 500, { cause: error });
    }
  }

  async deleteAvailability(providerId, userId) {
    try {
      const provider = await Provider.findByPk(providerId);
      if(!provider) {
        throw new AppError('Provider not found', 404);
      }

      if (provider.user_id !== userId) {
        throw new AppError('Forbidden: you do not own this provider availability', 403);
      }

      const deletedCount = await Availability.destroy({
        where: { provider_id: providerId }
      });

      return { deletedCount };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Error deleting availability', 500, { cause: error });
    }
  }
}

module.exports = new AvailabilityService();