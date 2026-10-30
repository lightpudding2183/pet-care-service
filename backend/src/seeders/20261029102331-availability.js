'use strict';

const { availabilityRows, allIds } = require('../mockdata');

const tableName = 'availability';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const ids = allIds.availability();
    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM ${tableName} WHERE id IN (:ids)`,
      { replacements: { ids } }
    );
    const have = new Set(existing.map((row) => row.id));
    const rows = availabilityRows().filter((row) => !have.has(row.id));
    if (rows.length) await queryInterface.bulkInsert(tableName, rows);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete(tableName, {
      id: { [Sequelize.Op.in]: allIds.availability() }
    });
  }
};
