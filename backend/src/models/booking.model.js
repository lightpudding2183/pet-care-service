const { DataTypes } = require('sequelize');
const sequelize = require('../config/database')

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  provider_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'provider',
      key: 'id'
    },
  },
  pet_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'pet',
      key: 'id'
    },
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'booking',
  timestamps: false,
  underscored: true
});

module.exports = Booking;