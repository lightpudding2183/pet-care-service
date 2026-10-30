'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('provider_services', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      provider_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'provider',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      service_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'services',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      price: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      price_unit: {
        type: Sequelize.ENUM('hour', 'visit', 'day'),
        allowNull: false,
        defaultValue: 'visit'
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

    await queryInterface.addIndex('provider_services', ['provider_id'], {
      name: 'idx_provider_services_provider_id'
    });

    await queryInterface.addIndex('provider_services', ['service_id'], {
      name: 'idx_provider_services_service_id'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('provider_services');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_provider_services_price_unit";');
  }
};
