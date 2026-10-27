const { DataTypes } = require('sequelize');
const sequelize = require('../config/database')

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  booking_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'booking',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type:DataTypes.ENUM('pending', 'paid', 'refunded'),
    allowNull: false
  },
  payment_provider_ref: {
    type: DataTypes.STRING,
    allowNull: true
  },
  method: {
    type: DataTypes.ENUM('cash', 'stripe'),
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'payment',
  timestamps: false,
  underscored: true
});

module.exports = Payment