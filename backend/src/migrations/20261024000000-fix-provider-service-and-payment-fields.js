'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('provider_services', 'price_unit', {
      type: Sequelize.ENUM('hour', 'visit', 'day'),
      allowNull: false,
      defaultValue: 'visit'
    });

    await queryInterface.changeColumn('notification', 'payload_json', {
      type: Sequelize.TEXT,
      allowNull: false
    });

    await queryInterface.changeColumn('payment', 'amount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('payment', 'amount', {
      type: Sequelize.FLOAT,
      allowNull: false
    });

    await queryInterface.changeColumn('notification', 'payload_json', {
      type: Sequelize.STRING,
      allowNull: false
    });

    await queryInterface.removeColumn('provider_services', 'price_unit');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_provider_services_price_unit";');
  }
};