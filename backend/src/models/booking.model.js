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
      model: 'user',
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
  service_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'services',
      key: 'id'
    }
  },
  price_snapshot: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled'),
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