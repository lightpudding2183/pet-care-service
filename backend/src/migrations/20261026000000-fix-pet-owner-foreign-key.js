'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        'ALTER TABLE "pet" DROP CONSTRAINT IF EXISTS "pet_owner_id_fkey"',
        { transaction }
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "pet" ADD CONSTRAINT "pet_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE',
        { transaction }
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        'ALTER TABLE "pet" DROP CONSTRAINT IF EXISTS "pet_owner_id_fkey"',
        { transaction }
      );
    });
  }
};