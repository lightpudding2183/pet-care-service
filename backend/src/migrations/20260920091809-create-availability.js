'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('availability', {
      availability_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      provider_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'provider',
          key: 'provider_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      is_recurring: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
    });

    await queryInterface.addIndex('availability', ['provider_id'], {
      name: 'idx_availability_provider_id'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('availability');
  }
};
