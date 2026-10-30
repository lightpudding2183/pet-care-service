const AppError = require('../utils/error');
const { Op } = require('sequelize');
const { Provider, User, Pet, Availability, ProviderServices, Booking, sequelize } = require('../index');

class BookingService {
  async _tableColumns(tableName) {
    return sequelize.getQueryInterface().describeTable(tableName);
  }

  async _findProviderService(providerId, serviceId, transaction) {
    const columns = await this._tableColumns('provider_services');
    const attributes = ['id', 'provider_id', 'service_id', 'price'];
    if (columns.price_unit) attributes.push('price_unit');
    return ProviderServices.findOne({
      attributes,
      where: { provider_id: providerId, service_id: serviceId },
      transaction
    });
  }

  async createBooking(bookingData) {
    try {
      if (!bookingData.provider_id || !bookingData.user_id || !bookingData.pet_id) {
        throw new AppError('Missing required fields', 400);
      }

      if (!bookingData.start_time || !bookingData.end_time || !bookingData.service_id) {
        throw new AppError('Missing required fields', 400);
      }

      const startTime = new Date(bookingData.start_time);
      const endTime = new Date(bookingData.end_time);
      if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime()) || startTime >= endTime) {
        throw new AppError('Invalid time range', 400);
      }
      if (startTime < new Date()) {
        throw new AppError('Booking start time must be in the future', 400);
      }

      return await sequelize.transaction(async (transaction) => {
        const provider = await Provider.findByPk(bookingData.provider_id, {
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        if (!provider) {
          throw new AppError('Provider not found', 404);
        }
        if (provider.verified !== true) {
          throw new AppError('Provider is not verified', 403);
        }

        const providerService = await this._findProviderService(provider.id, bookingData.service_id, transaction);
        if (!providerService) {
          throw new AppError('Selected service is not offered by this provider', 400);
        }
        const price = this._calculatePrice(providerService.price, providerService.price_unit, startTime, endTime);

        const pet = await Pet.findOne({
          where: { id: bookingData.pet_id, owner_id: bookingData.user_id },
          transaction
        });
        if (!pet) {
          throw new AppError('Pet not found or you do not own this pet', 403);
        }

        await this._assertAvailable(bookingData.provider_id, startTime, endTime, transaction);
        await this._assertNoConflict(bookingData.provider_id, startTime, endTime, null, transaction);
        const bookingColumns = await this._tableColumns('booking');
        const bookingDataToCreate = {
          user_id: bookingData.user_id,
          provider_id: bookingData.provider_id,
          pet_id: bookingData.pet_id,
          start_time: startTime,
          end_time: endTime
        };
        if (bookingColumns.service_id) bookingDataToCreate.service_id = bookingData.service_id;
        if (bookingColumns.price_snapshot) bookingDataToCreate.price_snapshot = price.amount;
        if (bookingColumns.notes && bookingData.notes) bookingDataToCreate.notes = bookingData.notes;
        if (bookingColumns.payment_method && ['stripe', 'cash'].includes(bookingData.payment_method)) {
          bookingDataToCreate.payment_method = bookingData.payment_method;
        }
        const booking = await Booking.create(bookingDataToCreate, { transaction });

        const notifService = require('./notif.service');
        await notifService.createNotif({
          user_id: provider.user_id,
          type: 'booking.created',
          payload_json: { booking_id: booking.id, provider_id: provider.id }
        }, { transaction });

        return booking;
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
        attributes: ['id', 'user_id', 'provider_id', 'pet_id', 'status', 'start_time', 'end_time', 'notes', 'payment_method', 'created_at', 'updated_at'],
        include: [
          {
            model: Provider,
            as: 'provider',
            include: [
              { model: User, as: 'user' },
              { model: Availability, as: 'availability' },
              {
                model: ProviderServices,
                as: 'provider_services',
                attributes: ['id', 'provider_id', 'service_id', 'price']
              }
            ]
          },
          { model: Pet, as: 'pet' }
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

  async getBookingsByUserId(userId, filters = {}) {
    try {
      return await this._listBookings({ user_id: userId }, filters, [
        {
          model: Provider,
          as: 'provider',
          include: [
            { model: User, as: 'user' },
            { model: Availability, as: 'availability' },
            {
              model: ProviderServices,
              as: 'provider_services',
              attributes: ['id', 'provider_id', 'service_id', 'price']
            }
          ]
        },
        { model: Pet, as: 'pet' }
      ]);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch bookings for user', 500, { cause: error });
    }
  }

  async getProviderBusySlots(providerId, from, to) {
    try {
      const start = new Date(from);
      const end = new Date(to);
      if (!from || !to || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
        throw new AppError('A valid from/to range is required', 400);
      }

      const bookings = await Booking.findAll({
        attributes: ['start_time', 'end_time'],
        where: {
          provider_id: providerId,
          status: { [Op.ne]: 'cancelled' },
          start_time: { [Op.lt]: end },
          end_time: { [Op.gt]: start }
        },
        order: [['start_time', 'ASC']]
      });

      return bookings.map((booking) => ({
        start_time: booking.start_time,
        end_time: booking.end_time
      }));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to check provider bookings', 500, { cause: error });
    }
  }

  async quoteBookingPrice(providerId, serviceId, from, to) {
    const startTime = new Date(from);
    const endTime = new Date(to);
    if (!providerId || !serviceId || !from || !to || Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime()) || startTime >= endTime) {
      throw new AppError('A provider, service, and valid time range are required', 400);
    }

    const provider = await Provider.findByPk(providerId);
    if (!provider) throw new AppError('Provider not found', 404);
    if (!provider.verified) throw new AppError('Provider is not verified', 403);

    const providerService = await this._findProviderService(providerId, serviceId);
    if (!providerService) throw new AppError('Selected service is not offered by this provider', 400);

    return this._calculatePrice(providerService.price, providerService.price_unit, startTime, endTime);
  }

  _calculatePrice(rate, unit = 'visit', startTime, endTime) {
    const rateAmount = Number(rate);
    if (!Number.isFinite(rateAmount) || rateAmount < 0) {
      throw new AppError('Provider service has an invalid price', 400);
    }

    const hours = (endTime.getTime() - startTime.getTime()) / (60 * 60 * 1000);
    let units = 1;
    if (unit === 'hour') units = hours;
    else if (unit === 'day') units = Math.ceil(hours / 24);

    return {
      amount: Math.round(rateAmount * units * 100) / 100,
      rate: rateAmount,
      unit,
      units
    };
  }

  async updateBooking(bookingId, updateData, userId, role) {
    try {
      const allowedFields = ['status', 'start_time', 'end_time', 'pet_id'];
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

        const nextProviderId = booking.provider_id;
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
        if ((changes.start_time || changes.end_time) && nextStart < new Date()) {
          throw new AppError('Booking start time must be in the future', 400);
        }
        if (changes.status) {
          this._assertStatusTransition(booking.status, changes.status, isCustomer, isProviderOwner);
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

        if (changes.start_time || changes.end_time) {
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
      return await this.updateBooking(bookingId, { status: 'cancelled' }, userId, role);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete booking', 500, { cause: error });
    }
  }

  async getBookingsByProviderId(providerId, userId, role, filters = {}) {
    try {
      const provider = await Provider.findByPk(providerId);
      if (!provider) {
        throw new AppError('Provider not found', 404);
      }
      if (role !== 'admin' && provider.user_id !== userId) {
        throw new AppError('Forbidden: you do not own this provider', 403);
      }

      return await this._listBookings({ provider_id: providerId }, filters, [
        { model: User, as: 'user' },
        { model: Pet, as: 'pet' },
        {
          model: Provider,
          as: 'provider',
          include: [
            { model: Availability, as: 'availability' },
            {
              model: ProviderServices,
              as: 'provider_services',
              attributes: ['id', 'provider_id', 'service_id', 'price']
            }
          ]
        },
      ]);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch bookings for provider', 500, { cause: error });
    }
  }

  _assertStatusTransition(currentStatus, nextStatus, isCustomer, isProviderOwner) {
    const transitions = {
      pending: { confirmed: 'provider', cancelled: 'customer' },
      confirmed: { in_progress: 'provider', cancelled: 'customer' },
      in_progress: { completed: 'provider' }
    };
    const requiredRole = transitions[currentStatus]?.[nextStatus];
    if (!requiredRole) {
      throw new AppError(`Cannot transition booking from ${currentStatus} to ${nextStatus}`, 409);
    }
    if ((requiredRole === 'customer' && !isCustomer) || (requiredRole === 'provider' && !isProviderOwner)) {
      throw new AppError('Forbidden: role cannot perform this booking transition', 403);
    }
  }

  async _listBookings(baseWhere, filters, include) {
    const { status, from, to, page = 1, limit = 20 } = filters;
    const pageNumber = Number.parseInt(page, 10);
    const pageSize = Number.parseInt(limit, 10);
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      throw new AppError('page must be positive and limit must be between 1 and 100', 400);
    }

    const where = { ...baseWhere };
    if (status) {
      if (!['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].includes(status)) {
        throw new AppError('Invalid booking status filter', 400);
      }
      where.status = status;
    }
    if (from || to) {
      where.start_time = {};
      if (from) {
        const fromDate = new Date(from);
        if (Number.isNaN(fromDate.getTime())) throw new AppError('Invalid from date', 400);
        where.start_time[Op.gte] = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (Number.isNaN(toDate.getTime())) throw new AppError('Invalid to date', 400);
        where.start_time[Op.lte] = toDate;
      }
      if (from && to && new Date(from) > new Date(to)) {
        throw new AppError('from must be earlier than or equal to to', 400);
      }
    }

    const { count, rows: bookings } = await Booking.findAndCountAll({
      where,
      attributes: ['id', 'user_id', 'provider_id', 'pet_id', 'status', 'start_time', 'end_time', 'created_at', 'updated_at'],
      include,
      order: [['start_time', 'ASC']],
      limit: pageSize,
      offset: (pageNumber - 1) * pageSize,
      distinct: true
    });
    return { bookings, total: count, page: pageNumber, totalPages: Math.ceil(count / pageSize) };
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
    if (availability) return;

    const recurringWindows = await Availability.findAll({
      where: { provider_id: providerId, is_recurring: true },
      transaction
    });
    const startDay = Date.UTC(startTime.getUTCFullYear(), startTime.getUTCMonth(), startTime.getUTCDate());
    const endDay = Date.UTC(endTime.getUTCFullYear(), endTime.getUTCMonth(), endTime.getUTCDate());
    const startOffset = startTime.getUTCHours() * 60 + startTime.getUTCMinutes();
    const endOffset = endTime.getUTCHours() * 60 + endTime.getUTCMinutes();
    const matchesRecurringWindow = startDay === endDay && recurringWindows.some((window) => {
      const templateDate = new Date(window.date);
      const templateStart = new Date(window.start_time);
      const templateEnd = new Date(window.end_time);
      if ([templateDate, templateStart, templateEnd].some((date) => Number.isNaN(date.getTime()))) return false;
      const windowStart = templateStart.getUTCHours() * 60 + templateStart.getUTCMinutes();
      const windowEnd = templateEnd.getUTCHours() * 60 + templateEnd.getUTCMinutes();
      return startTime.getUTCDay() === templateDate.getUTCDay()
        && startOffset >= windowStart && endOffset <= windowEnd;
    });

    if (!matchesRecurringWindow) throw new AppError('Requested time is outside provider availability', 409);
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
