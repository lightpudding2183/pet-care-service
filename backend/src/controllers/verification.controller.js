const verificationService = require('../services/verification.service');
const AppError = require('../utils/error');

async function getUserRole(req, res) {
  try {
    const userId = req.user.id;
    const role = await verificationService.getUserRole(userId);
    res.status(200).json({ userId, role });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function checkUserRole(req, res) {
  try {
    const userId = req.user.id;
    const requiredRole = req.params.role || req.query.role;
    if (!requiredRole) {
      return res.status(400).json({ error: 'Role is required' });
    }
    const hasRole = await verificationService.hasRole(userId, requiredRole);
    res.status(200).json({ userId, hasRole });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function checkAnyRole(req, res) {
  try {
    const { roles } = req.query;
    const roleList = roles ? roles.split(',').map((r) => r.trim()) : [];

    if (!roleList.length) {
      return res.status(400).json({ error: 'No roles specified' });
    }

    const hasAny = await verificationService.hasAnyRole(req.user.id, roleList);
    res.status(200).json({
      requestedRoles: roleList,
      hasAny,
      message: hasAny
        ? 'User has at least one of the specified roles'
        : 'User does not have any of the specified roles'
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function getActionRequirements(req, res) {
  try {
    const { action } = req.params;
    const requirements = verificationService.getRoleRequiredForAction(action);
    if (!requirements) {
      return res.status(404).json({ error: 'Unknown action' });
    }
    res.status(200).json({ action, requiredRoles: requirements });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function verifyResourceAccess(req, res) {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId || req.body.targetUserId || req.query.targetUserId;
    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' });
    }

    await verificationService.verifyResourceAccess(currentUserId, targetUserId);
    res.status(200).json({ allowed: true });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = {
  getUserRole,
  checkUserRole,
  checkAnyRole,
  getActionRequirements,
  verifyResourceAccess
};
