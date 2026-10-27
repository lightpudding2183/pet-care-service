'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      'ALTER TYPE "enum_booking_status" ADD VALUE IF NOT EXISTS \'in_progress\';'
    );

    await queryInterface.addColumn('booking', 'service_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'services', key: 'service_id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    await queryInterface.addColumn('booking', 'price_snapshot', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('booking', 'price_snapshot');
    await queryInterface.removeColumn('booking', 'service_id');
  }
};