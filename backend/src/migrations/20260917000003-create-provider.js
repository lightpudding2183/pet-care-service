'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('provider', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      business_name: {
        type: Sequelize.STRING(256),
        allowNull: false
      },
      address: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      verification_document_url: {
        type: Sequelize.STRING(256),
        allowNull: true
      },
      latitude: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      longitude: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'user',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      rating_avg: {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: null
      },
      rating_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('provider', ['user_id'], {
      name: 'idx_provider_user_id'
    });

    await queryInterface.addIndex('provider', ['latitude', 'longitude'], {
      name: 'idx_provider_location'
    });

    await queryInterface.addConstraint('provider', {
      fields: ['user_id'],
      type: 'unique',
      name: 'provider_user_id_unique'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('provider');
  }
};
