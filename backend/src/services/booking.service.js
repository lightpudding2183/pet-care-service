const AppError = require('../utils/error');
const { Op } = require('sequelize');
const { Provider, User, Pet, Availability, ProviderServices, Booking, sequelize } = require('../index');

class BookingService {
  async createBooking(bookingData) {
    try {
      if (!bookingData.provider_id || !bookingData.user_id || !bookingData.pet_id) {
        throw new AppError('Missing required fields', 400);
      }

      if (!bookingData.start_time || !bookingData.end_time) {
        throw new AppError('Missing required fields', 400);
      }

      const startTime = new Date(bookingData.start_time);
      const endTime = new Date(bookingData.end_time);
      if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime()) || startTime >= endTime) {
        throw new AppError('Invalid time range', 400);
      }

      return await sequelize.transaction(async (transaction) => {
        const provider = await Provider.findByPk(bookingData.provider_id, {
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        if (!provider) {
          throw new AppError('Provider not found', 404);
        }

        const pet = await Pet.findOne({
          where: { id: bookingData.pet_id, owner_id: bookingData.user_id },
          transaction
        });
        if (!pet) {
          throw new AppError('Pet not found or you do not own this pet', 403);
        }

        await this._assertAvailable(bookingData.provider_id, startTime, endTime, transaction);
        await this._assertNoConflict(bookingData.provider_id, startTime, endTime, null, transaction);
        return Booking.create({
          user_id: bookingData.user_id,
          provider_id: bookingData.provider_id,
          pet_id: bookingData.pet_id,
          start_time: startTime,
          end_time: endTime
        }, { transaction });
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create booking', 500, { cause: error });
    }
  }

  async getBookingDetails(bookingId, userId, role) {
    try {
      const booking = await Booking.findByPk(bookingId, {
        include: [
          {
            model: Provider,
            as: 'provider',
            include: [
              { model: User, as: 'user' },
              { model: Availability, as: 'availability' },
              { model: ProviderServices, as: 'provider_services' }
            ]
          }
        ]
      });
      if (!booking) {
        throw new AppError('Booking not found', 404);
      }
      if (role !== 'admin' && booking.user_id !== userId && booking.provider?.user_id !== userId) {
        throw new AppError('Forbidden: you do not have access to this booking', 403);
      }
      return booking;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch booking details', 500, { cause: error });
    }
  }

  async getBookingsByUserId(userId) {
    try {
      const bookings = await Booking.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Provider,
            as: 'provider',
            include: [
              { model: User, as: 'user' },
              { model: Availability, as: 'availability' },
              { model: ProviderServices, as: 'provider_services' }
            ]
          }
        ]
      });
      return bookings;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch bookings for user', 500, { cause: error });
    }
  }

  async updateBooking(bookingId, updateData, userId, role) {
    try {
      const allowedFields = ['status', 'start_time', 'end_time', 'provider_id', 'pet_id'];
      const changes = Object.fromEntries(
        Object.entries(updateData).filter(([key]) => allowedFields.includes(key))
      );

      return await sequelize.transaction(async (transaction) => {
        const booking = await Booking.findByPk(bookingId, {
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        if (!booking) {
          throw new AppError('Booking not found', 404);
        }

        const nextProviderId = changes.provider_id ?? booking.provider_id;
        const providerIds = [...new Set([booking.provider_id, nextProviderId])].sort();
        const providers = new Map();
        for (const providerId of providerIds) {
          const provider = await Provider.findByPk(providerId, {
            transaction,
            lock: transaction.LOCK.UPDATE
          });
          if (provider) providers.set(providerId, provider);
        }

        const currentProvider = providers.get(booking.provider_id);
        const isCustomer = booking.user_id === userId;
        const isProviderOwner = currentProvider?.user_id === userId;
        if (role !== 'admin' && !isCustomer && !isProviderOwner) {
          throw new AppError('Forbidden: you do not have access to this booking', 403);
        }
        if (isProviderOwner && !isCustomer && Object.keys(changes).some((key) => key !== 'status')) {
          throw new AppError('Providers may only update booking status', 403);
        }
        if (!providers.has(nextProviderId)) {
          throw new AppError('Provider not found', 404);
        }

        const nextStart = new Date(changes.start_time ?? booking.start_time);
        const nextEnd = new Date(changes.end_time ?? booking.end_time);
        if (Number.isNaN(nextStart.getTime()) || Number.isNaN(nextEnd.getTime()) || nextStart >= nextEnd) {
          throw new AppError('Invalid time range', 400);
        }

        if (changes.pet_id) {
          const pet = await Pet.findOne({
            where: { id: changes.pet_id, owner_id: booking.user_id },
            transaction
          });
          if (!pet) {
            throw new AppError('Pet not found or you do not own this pet', 403);
          }
        }

        if (changes.start_time || changes.end_time || changes.provider_id) {
          await this._assertAvailable(nextProviderId, nextStart, nextEnd, transaction);
          await this._assertNoConflict(nextProviderId, nextStart, nextEnd, bookingId, transaction);
        }

        await booking.update(changes, { transaction });
        return booking;
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update booking', 500, { cause: error });
    }
  }

  async deleteBooking(bookingId, userId, role) {
    try {
      const booking = await Booking.findByPk(bookingId);
      if (!booking) {
        throw new AppError('Booking not found', 404);
      }
      if (role !== 'admin' && booking.user_id !== userId) {
        throw new AppError('Forbidden: only the booking owner can delete this booking', 403);
      }
      await booking.destroy();
      return { message: 'Booking deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete booking', 500, { cause: error });
    }
  }

  async getBookingsByProviderId(providerId, userId, role) {
    try {
      const provider = await Provider.findByPk(providerId);
      if (!provider) {
        throw new AppError('Provider not found', 404);
      }
      if (role !== 'admin' && provider.user_id !== userId) {
        throw new AppError('Forbidden: you do not own this provider', 403);
      }

      const bookings = await Booking.findAll({
        where: { provider_id: providerId },
        include: [
          { model: User, as: 'user' },
          {
            model: Provider,
            as: 'provider',
            include: [
              { model: Availability, as: 'availability' },
              { model: ProviderServices, as: 'provider_services' }
            ]
          }
        ]
      });
      return bookings;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch bookings for provider', 500, { cause: error });
    }
  }

  async _assertAvailable(providerId, startTime, endTime, transaction) {
    const availability = await Availability.findOne({
      where: {
        provider_id: providerId,
        start_time: { [Op.lte]: startTime },
        end_time: { [Op.gte]: endTime }
      },
      transaction
    });
    if (!availability) {
      throw new AppError('Requested time is outside provider availability', 409);
    }
  }

  async _assertNoConflict(providerId, startTime, endTime, excludedBookingId, transaction) {
    const where = {
      provider_id: providerId,
      status: { [Op.ne]: 'cancelled' },
      start_time: { [Op.lt]: endTime },
      end_time: { [Op.gt]: startTime }
    };
    if (excludedBookingId) where.id = { [Op.ne]: excludedBookingId };

    const conflictingBooking = await Booking.findOne({ where, transaction });
    if (conflictingBooking) {
      throw new AppError('Provider is not available for the requested time', 409);
    }
  }
}

module.exports = new BookingService();
