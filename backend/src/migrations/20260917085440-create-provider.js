'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('provider', {
      provider_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      business_name: {
        type: Sequelize.STRING(256),
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      verified: {
        type:Sequelize.BOOLEAN,
        allowNull: false,
      },
      verification_document_url: {
        type: Sequelize.STRING(256),
        allowNull: true,
      },
      latitude: {
        type:Sequelize.FLOAT,
        allowNull: true,
      },
      longitude: {
        type:Sequelize.FLOAT,
        allowNull: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'user',
          key: 'user_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      rating_avg: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      rating_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      }
    });

    await queryInterface.addIndex('provider', ['user_id'], {
      name: 'idx_provider_user_id'
    });

    await queryInterface.addIndex('provider', ['latitude', 'longitude'], {
      name: 'idx_provider_location'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('provider');
  }
};
