'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addConstraint('review', {
      fields: ['booking_id'],
      type: 'unique',
      name: 'review_booking_id_unique'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('review', 'review_booking_id_unique');
  }
};