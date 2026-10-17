const { User } = require('../index');
const AppError = require('../utils/error');

class VerificationService {
  async getUserRole(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: ['id', 'email', 'role']
      });
      if (!user) {
        throw new AppError('User not found', 404);
      }
      return user.role;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch user role', 500, { cause: error });
    }
  }

  async hasRole(userId, requiredRole) {
    try {
      const role = await this.getUserRole(userId);
      return role === requiredRole;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to verify user role', 500, { cause: error });
    }
  }

  async hasAnyRole(userId, allowedRoles) {
    try {
      const userRole = await this.getUserRole(userId);
      return allowedRoles.includes(userRole);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to verify user role', 500, { cause: error });
    }
  }

  async verifyResourceAccess(currentUserId, targetUserId) {
    try {
      const isAdmin = await this.hasRole(currentUserId, 'admin');
      if (isAdmin) {
        return true;
      }

      if (String(currentUserId) === String(targetUserId)) {
        return true;
      }

      throw new AppError('Access denied', 403);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to verify resource access', 500, { cause: error });
    }
  }

  getRoleRequiredForAction(action) {
    const requirements = {
      getProfile: ['user', 'provider', 'admin'],
      updateProfile: ['user', 'provider', 'admin'],
      createProviderProfile: ['user', 'provider', 'admin'],
      manageBookings: ['user', 'provider', 'admin'],
      viewReviews: ['user', 'provider', 'admin'],
      adminPanel: ['admin']
    };
    return requirements[action] || null;
  }
}

module.exports = new VerificationService();
