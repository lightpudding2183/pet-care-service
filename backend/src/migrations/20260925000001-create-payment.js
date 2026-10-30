'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('payment', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      booking_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'booking',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'paid', 'refunded'),
        allowNull: false
      },
      payment_provider_ref: {
        type: Sequelize.STRING,
        allowNull: true
      },
      method: {
        type: Sequelize.ENUM('cash', 'stripe'),
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('payment', ['booking_id'], {
      name: 'idx_payment_booking_id'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('payment');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_payment_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_payment_method";');
  }
};
