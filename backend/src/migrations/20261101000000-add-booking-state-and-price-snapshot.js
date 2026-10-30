'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [exists] = await queryInterface.sequelize.query(
      `SELECT 1 FROM pg_enum e
       JOIN pg_type t ON e.enumtypid = t.oid
       WHERE t.typname = 'enum_booking_status' AND e.enumlabel = 'in_progress'`
    );
    if (exists.length === 0) {
      await queryInterface.sequelize.query(
        'ALTER TYPE "enum_booking_status" ADD VALUE \'in_progress\';'
      );
    }

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
