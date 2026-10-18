const AppError = require('../utils/error');
const { Provider, User, sequelize } = require('../index');

class ProviderService {
  async getProviderById(providerId) {
    try {
      const provider = await Provider.findByPk(providerId);
      if(!provider) {
        throw new AppError('Provider not found', 404);
      }
      return provider;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Error fetching provider', 500, { cause: error });
    }
  }

  async createProvider(providerData, userId) {
    try {
      return await sequelize.transaction(async (transaction) => {
        const user = await User.findByPk(userId, {
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        if (!user) {
          throw new AppError('User not found', 404);
        }

        const existingProvider = await Provider.findOne({
          where: { user_id: userId },
          transaction
        });
        if (existingProvider) {
          throw new AppError('User already has a provider profile', 409);
        }

        const provider = await Provider.create({
          ...providerData,
          user_id: userId
        }, { transaction });

        if (user.role !== 'admin') {
          user.role = 'provider';
          await user.save({ transaction });
        }

        return provider;
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('User already has a provider profile', 409, { cause: error });
      }
      throw new AppError('Error creating provider', 500, { cause: error });
    }
  }

  async updateProvider(providerId, updateData, userId) {
    try {
      const provider = await Provider.findByPk(providerId);
      if (!provider) {
        throw new AppError('Provider not found', 404);
      }

      if (provider.user_id !== userId) {
        throw new AppError('Forbidden: you do not own this provider profile', 403);
      }

      await provider.update(updateData);
      return provider;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Error updating provider', 500, { cause: error });
    }
  }
}

module.exports = new ProviderService();