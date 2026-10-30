const { Op } = require('sequelize');
const AppError = require('../utils/error');
const { Availability, Provider, ProviderServices, Services, User, sequelize } = require('../index');

const EARTH_RADIUS_KM = 6371;

class SearchService {
  async searchProviders(filters = {}) {
    try {
      const {
        lat,
        lng,
        radiusKm,
        serviceId,
        minRating,
        from,
        to,
        page = 1,
        limit = 20
      } = filters;
      const latitude = this._optionalNumber(lat, 'lat', -90, 90);
      const longitude = this._optionalNumber(lng, 'lng', -180, 180);
      const radius = this._optionalNumber(radiusKm, 'radiusKm', 0, 20037.5);
      const rating = this._optionalNumber(minRating, 'minRating', 0, 5);
      const pageNumber = this._positiveInteger(page, 'page');
      const pageSize = this._positiveInteger(limit, 'limit', 100);

      if ((latitude === null) !== (longitude === null)) {
        throw new AppError('lat and lng must be supplied together', 400);
      }
      if (radius !== null && latitude === null) {
        throw new AppError('radiusKm requires lat and lng', 400);
      }
      let fromDate;
      let toDate;
      if (from) fromDate = new Date(from);
      if (to) toDate = new Date(to);
      if ((fromDate && Number.isNaN(fromDate.getTime())) || (toDate && Number.isNaN(toDate.getTime()))) {
        throw new AppError('from and to must be valid dates', 400);
      }
      if (fromDate && toDate && fromDate >= toDate) {
        throw new AppError('from must be earlier than to', 400);
      }

      const where = { verified: true };
      if (rating !== null) where.rating_avg = { [Op.gte]: rating };
      const distanceExpression = latitude === null
        ? 'NULL::double precision'
        : this._distanceExpression(latitude, longitude);
      if (radius !== null) {
        where[Op.and] = [sequelize.literal(`${distanceExpression} <= ${radius}`)];
      }

      const include = [{
        model: ProviderServices,
        as: 'provider_services',
        attributes: ['id', 'provider_id', 'service_id', 'price'],
        required: serviceId !== undefined && serviceId !== '',
        where: serviceId ? { service_id: serviceId } : undefined,
        include: [{ model: Services, as: 'service' }]
      }, {
        model: User,
        as: 'user',
        attributes: ['id', 'full_name', 'avatar_url']
      }];
      if (fromDate || toDate) {
        const availabilityWhere = {};
        if (toDate) availabilityWhere.start_time = { [Op.lte]: toDate };
        if (fromDate) availabilityWhere.end_time = { [Op.gte]: fromDate };
        include.push({
          model: Availability,
          as: 'availability',
          required: true,
          where: availabilityWhere
        });
      }

      const order = [
        sequelize.literal('"Provider"."rating_avg" DESC NULLS LAST'),
        [sequelize.literal(distanceExpression), 'ASC']
      ];

      const { count, rows } = await Provider.findAndCountAll({
        where,
        attributes: { include: [[sequelize.literal(distanceExpression), 'distance_km']] },
        include,
        order,
        limit: pageSize,
        offset: (pageNumber - 1) * pageSize,
        distinct: true
      });

      return {
        providers: rows,
        total: count,
        page: pageNumber,
        totalPages: Math.ceil(count / pageSize)
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error searching providers', 500, { cause: error });
    }
  }

  _distanceExpression(latitude, longitude) {
    const latRadians = `radians(${latitude})`;
    const lngRadians = `radians(${longitude})`;
    const providerLat = 'radians("Provider"."latitude")';
    const providerLng = 'radians("Provider"."longitude")';
    const cosine = `cos(${latRadians}) * cos(${providerLat}) * cos(${providerLng} - ${lngRadians}) + sin(${latRadians}) * sin(${providerLat})`;
    return `${EARTH_RADIUS_KM} * acos(LEAST(1.0, GREATEST(-1.0, ${cosine})))`;
  }

  _optionalNumber(value, name, min, max) {
    if (value === undefined || value === null || value === '') return null;
    const number = Number(value);
    if (!Number.isFinite(number) || number < min || number > max) {
      throw new AppError(`${name} must be a number between ${min} and ${max}`, 400);
    }
    return number;
  }

  _positiveInteger(value, name, max = Number.MAX_SAFE_INTEGER) {
    const number = Number(value);
    if (!Number.isInteger(number) || number < 1 || number > max) {
      throw new AppError(`${name} must be an integer between 1 and ${max}`, 400);
    }
    return number;
  }
}

module.exports = new SearchService();
