'use strict';

const { providerRows, allIds } = require('../mockdata');

const tableNames = ['provider'];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    for (const tableName of tableNames) {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM "${tableName}" WHERE id IN (:ids)`,
        { replacements: { ids: allIds.providers() } }
      );
      const existingIds = new Set(existing.map((row) => row.id));
      const rows = providerRows().filter((row) => !existingIds.has(row.id));
      if (rows.length) await queryInterface.bulkInsert(tableName, rows);
    }
  },

  async down (queryInterface, Sequelize) {
    for (const tableName of [...tableNames].reverse()) {
      await queryInterface.bulkDelete(tableName, { id: { [Sequelize.Op.in]: allIds.providers() } });
    }
  }
};
