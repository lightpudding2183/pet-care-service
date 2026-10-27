const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProviderServices = sequelize.define('ProviderServices', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  provider_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'provider',
      key: 'id'
    }
  },
  service_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'services',
      key: 'id'
    }
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  price_unit: {
    type: DataTypes.ENUM('hour', 'visit', 'day'),
    allowNull: false,
    defaultValue: 'visit'
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
  tableName: 'provider_services',
  timestamps: false,
  underscored: true
});

module.exports = ProviderServices;