'use strict';
const { serviceRows, allIds } = require('../mockdata');

const tableName = 'services';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const ids = allIds.services();
    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM ${tableName} WHERE id IN (:ids)`,
      { replacements: { ids } }
    );
    const have = new Set(existing.map((row) => row.id));
    const rows = serviceRows().filter((row) => !have.has(row.id));
    if (rows.length) await queryInterface.bulkInsert(tableName, rows);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete(tableName, {
      service_name: { [Sequelize.Op.in]: allIds.services() }
    });
  }
};
