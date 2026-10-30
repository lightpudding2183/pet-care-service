'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "service_id" UUID NULL;'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "price_snapshot" DECIMAL(10, 2) NULL;'
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE "booking" DROP COLUMN IF EXISTS "price_snapshot";'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "booking" DROP COLUMN IF EXISTS "service_id";'
    );
  }
};
