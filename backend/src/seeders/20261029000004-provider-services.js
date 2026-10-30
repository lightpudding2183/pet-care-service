'use strict';

const { providerServiceRows, allIds } = require('../mockdata');

const tableName = 'provider_services';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const [existing] = await queryInterface.sequelize.query(
      'SELECT id FROM provider_services WHERE id IN (:ids)',
      { replacements: { ids: allIds.providerServices() } }
    );
    const have = new Set(existing.map((row) => row.id));
    const missing = providerServiceRows().filter((row) => !have.has(row.id));
    if (missing.length) await queryInterface.bulkInsert(tableName, missing);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete(tableName, { id: { [Sequelize.Op.in]: allIds.providerServices() } });
  }
};
