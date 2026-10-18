const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Provider = sequelize.define('Provider', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  business_name: {
    type: DataTypes.STRING,
    allowNull: false
  },

  address: {
    type: DataTypes.STRING,
    allowNull: false
  },

  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  verification_document_url: {
    type: DataTypes.STRING,
    allowNull: true
  },

  latitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },

  longitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },

  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'user',
      key: 'id'
    }
  },

  rating_avg: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: null
  },

  rating_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
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
  tableName: 'provider',
  timestamps: false,
  underscored: true
});

module.exports = Provider;