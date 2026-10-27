const sequelize = require('./config/database');
const User = require('./models/user.model');
const Pet = require('./models/pet.model');
const Provider = require('./models/provider.model');
const Services = require('./models/services.model');
const ProviderServices = require('./models/providerServices.model');
const Availability = require('./models/availability.model');
const Booking = require('./models/booking.model');
const Payment = require('./models/payment.model');
const Review = require('./models/review.model');
const Notification = require('./models/notif.model');

User.hasMany(Pet, { foreignKey: 'owner_id', as: 'pets', constraints: false });
Pet.belongsTo(User, { foreignKey: 'owner_id', as: 'user', constraints: false });

User.hasOne(Provider, { foreignKey: 'user_id', as: 'provider' });
Provider.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Provider.hasMany(Booking, { foreignKey: 'provider_id', as: 'bookings' });
Booking.belongsTo(Provider, { foreignKey: 'provider_id', as: 'provider' });

Pet.hasMany(Booking, { foreignKey: 'pet_id', as: 'bookings' });
Booking.belongsTo(Pet, { foreignKey: 'pet_id', as: 'pet' });
Services.hasMany(Booking, { foreignKey: 'service_id', as: 'bookings' });
Booking.belongsTo(Services, { foreignKey: 'service_id', as: 'service' });

Provider.hasMany(ProviderServices, { foreignKey: 'provider_id', as: 'provider_services' });
ProviderServices.belongsTo(Provider, { foreignKey: 'provider_id', as: 'provider' });

Services.hasMany(ProviderServices, { foreignKey: 'service_id', as: 'provider_services' });
ProviderServices.belongsTo(Services, { foreignKey: 'service_id', as: 'service' });

Provider.hasMany(Availability, { foreignKey: 'provider_id', as: 'availability' });
Availability.belongsTo(Provider, { foreignKey: 'provider_id', as: 'provider' });

Booking.hasOne(Payment, { foreignKey: 'booking_id', as: 'payment' });
Payment.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

Booking.hasOne(Review, { foreignKey: 'booking_id', as: 'review' });
Review.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

User.hasMany(Review, { foreignKey: 'reviewer_id', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'reviewer_id', as: 'user' });

Provider.hasMany(Review, { foreignKey: 'reviewee_id', as: 'reviews' });
Review.belongsTo(Provider, { foreignKey: 'reviewee_id', as: 'provider' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  User,
  Pet,
  Provider,
  Services,
  ProviderServices,
  Availability,
  Booking,
  Payment,
  Review,
  Notification,
  sequelize
};