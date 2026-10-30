'use strict';
const { userRows, allIds } = require('../mockdata');

const tableNames = ['user'];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const bcrypt = require('bcrypt');
    // Every mock provider logs in with: provider01@example.com ... provider11@example.com / Password123
    const passwordHash = bcrypt.hashSync('Password123', 10);
    const ids = allIds.users();
    for (const tableName of tableNames) {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM "${tableName}" WHERE id IN (:ids)`,
        { replacements: { ids } }
      );
      const have = new Set(existing.map((row) => row.id));
      const rows = userRows(passwordHash).filter((row) => !have.has(row.id));
      if (rows.length) await queryInterface.bulkInsert(tableName, rows);
    }

  },

  async down (queryInterface, Sequelize) {
    for (const tableName of [...tableNames].reverse()) {
      await queryInterface.bulkDelete(tableName, { id: { [Sequelize.Op.in]: allIds.users() } });
    }
  }
};
