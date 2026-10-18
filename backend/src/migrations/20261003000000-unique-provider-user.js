'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addConstraint('provider', {
      fields: ['user_id'],
      type: 'unique',
      name: 'provider_user_id_unique'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('provider', 'provider_user_id_unique');
  }
};