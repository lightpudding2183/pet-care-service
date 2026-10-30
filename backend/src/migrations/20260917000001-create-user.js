'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('user', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      role: {
        type: Sequelize.ENUM('user', 'provider', 'admin'),
        allowNull: false,
        defaultValue: 'user'
      },
      full_name: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      avatar_url: {
        type: Sequelize.STRING(256),
        allowNull: true
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

    await queryInterface.addIndex('user', ['role'], {
      name: 'users_role_idx'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('user');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_user_role";');
  }
};
