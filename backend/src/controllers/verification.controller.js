const verificationService = require('../services/verification.service');
const AppError = require('../utils/error');
const asyncHandler = require('../utils/asyncHandler');

const getUserRole = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const role = await verificationService.getUserRole(userId);
  res.status(200).json({ userId, role });
});

const checkUserRole = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const requiredRole = req.params.role || req.query.role;
  if (!requiredRole) throw new AppError('Role is required', 400);
  const hasRole = await verificationService.hasRole(userId, requiredRole);
  res.status(200).json({ userId, hasRole });
});

const checkAnyRole = asyncHandler(async (req, res) => {
  const { roles } = req.query;
  const roleList = roles ? roles.split(',').map((role) => role.trim()) : [];
  if (!roleList.length) throw new AppError('No roles specified', 400);

  const hasAny = await verificationService.hasAnyRole(req.user.id, roleList);
  res.status(200).json({
    requestedRoles: roleList,
    hasAny,
    message: hasAny
      ? 'User has at least one of the specified roles'
      : 'User does not have any of the specified roles'
  });
});

const getActionRequirements = asyncHandler(async (req, res) => {
  const { action } = req.params;
  const requirements = verificationService.getRoleRequiredForAction(action);
  if (!requirements) throw new AppError('Unknown action', 404);
  res.status(200).json({ action, requiredRoles: requirements });
});

const verifyResourceAccess = asyncHandler(async (req, res) => {
  const targetUserId = req.params.userId || req.body.targetUserId || req.query.targetUserId;
  if (!targetUserId) throw new AppError('targetUserId is required', 400);
  await verificationService.verifyResourceAccess(req.user.id, targetUserId);
  res.status(200).json({ allowed: true });
});

module.exports = {
  getUserRole,
  checkUserRole,
  checkAnyRole,
  getActionRequirements,
  verifyResourceAccess
};
