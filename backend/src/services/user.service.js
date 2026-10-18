const { User } = require('../index');
const AppError = require('../utils/error');

const PROFILE_UPDATE_FIELDS = ['phone', 'full_name', 'avatar_url'];

class UserService {
  async getProfile(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: ['id', 'email', 'phone', 'full_name', 'avatar_url', 'role']
      });
      if (!user) throw new AppError('User not found', 404);
      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Error fetching user profile', 500, { cause: error });
    }
  }

  async updateProfile(userId, updatedData) {
    try {
      const sanitized = {};
      for (const field of PROFILE_UPDATE_FIELDS) {
        if (updatedData[field] !== undefined) {
          sanitized[field] = updatedData[field];
        }
      }

      if (Object.keys(sanitized).length === 0) {
        throw new AppError('No valid profile fields to update', 400);
      }

      const [updatedRows] = await User.update(sanitized, {
        where: { id: userId }
      });
      if (updatedRows === 0) {
        throw new AppError('User not found', 404);
      }
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Error updating user profile', 500, { cause: error });
    }
  }
}

module.exports = new UserService();
