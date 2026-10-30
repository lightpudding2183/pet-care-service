'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [priceUnitRows] = await queryInterface.sequelize.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'provider_services' AND column_name = 'price_unit'`
    );
    if (priceUnitRows.length === 0) {
      await queryInterface.addColumn('provider_services', 'price_unit', {
        type: Sequelize.ENUM('hour', 'visit', 'day'),
        allowNull: false,
        defaultValue: 'visit'
      });
    }

    await queryInterface.sequelize.query(
      'ALTER TABLE "notification" ALTER COLUMN "payload_json" TYPE TEXT;'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "payment" ALTER COLUMN "amount" TYPE DECIMAL(10, 2);'
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      'ALTER TABLE "payment" ALTER COLUMN "amount" TYPE FLOAT;'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "notification" ALTER COLUMN "payload_json" TYPE VARCHAR(255);'
    );

    const [priceUnitRows] = await queryInterface.sequelize.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'provider_services' AND column_name = 'price_unit'`
    );
    if (priceUnitRows.length > 0) {
      await queryInterface.removeColumn('provider_services', 'price_unit');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_provider_services_price_unit";');
    }
  }
};
