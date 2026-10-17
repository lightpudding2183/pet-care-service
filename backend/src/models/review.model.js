const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
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
  reviewer_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'user',
      key: 'id'
    }
  },
  reviewee_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'provider',
      key: 'id'
    }
  },
  rating: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  comment: {
    type: DataTypes.STRING,
    allowNull: true
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
  tableName: 'review',
  timestamps: false,
  underscored: true
});

module.exports = Review;