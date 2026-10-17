const { Op } = require('sequelize');
const AppError = require('../utils/error');
const { Provider } = require('../index');

class SearchService {
  async searchProviders(searchTerm) {
    try {
      const providers = await Provider.findAll({
        where: {
          business_name: {
            [Op.iLike]: `%${searchTerm}%`
          }
        }
      });
      return providers;
    } catch (error) {
      throw new AppError('Error searching providers', 500, { cause: error });
    }
  }

  async searchProvidersByLocation(location) {
    try {
      const providers = await Provider.findAll({
        where: {
          address: {
            [Op.iLike]: `%${location}%`
          }
        }
      });
      return providers;
    } catch (error) {
      throw new AppError('Error searching providers by location', 500, { cause: error });
    }
  }
}

module.exports = new SearchService();
