const AppError = require('../utils/error');
const { Provider, Availability } = require('../index');

const DAY_MS = 24 * 60 * 60 * 1000;
const LOOKAHEAD_DAYS = 60;

function expandAvailability(records, now = new Date()) {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const windows = [];

  for (const record of records) {
    const row = typeof record.get === 'function' ? record.get({ plain: true }) : record;
    const templateDate = new Date(row.date);
    const templateStart = new Date(row.start_time);
    const templateEnd = new Date(row.end_time);
    if (!row.date || !row.start_time || !row.end_time
      || Number.isNaN(templateDate.getTime()) || Number.isNaN(templateStart.getTime()) || Number.isNaN(templateEnd.getTime())) {
      windows.push(row);
      continue;
    }

    if (!row.is_recurring) {
      if (templateEnd > now) windows.push(row);
      continue;
    }

    const duration = templateEnd.getTime() - templateStart.getTime();
    for (let offset = 0; offset <= LOOKAHEAD_DAYS; offset += 1) {
      const date = new Date(today + offset * DAY_MS);
      if (date.getUTCDay() !== templateDate.getUTCDay()) continue;

      const start = new Date(date);
      start.setUTCHours(templateStart.getUTCHours(), templateStart.getUTCMinutes(), templateStart.getUTCSeconds(), templateStart.getUTCMilliseconds());
      const end = new Date(start.getTime() + duration);
      if (end <= now) continue;

      const dateKey = start.toISOString().slice(0, 10);
      windows.push({
        ...row,
        id: `${row.id ?? 'availability'}-${dateKey}`,
        schedule_id: row.id,
        date,
        start_time: start,
        end_time: end
      });
    }
  }

  return windows.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
}

class AvailabilityService {
  async getAvailabilityByProviderId(providerId) {
    try {
      const provider = await Provider.findByPk(providerId);
      if (!provider) {
        throw new AppError('Provider not found', 404);
      }

      const availability = await Availability.findAll({
        where: { provider_id: providerId },
        order: [['date', 'ASC'], ['start_time', 'ASC']]
      });

      return expandAvailability(availability);
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