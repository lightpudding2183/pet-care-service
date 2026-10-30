'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "notes" TEXT NULL;'
    );
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_booking_payment_method" AS ENUM ('stripe', 'cash');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryInterface.sequelize.query(
      'ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "payment_method" "enum_booking_payment_method" NULL;'
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE "booking" DROP COLUMN IF EXISTS "notes";'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "booking" DROP COLUMN IF EXISTS "payment_method";'
    );
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_booking_payment_method";');
  }
};
