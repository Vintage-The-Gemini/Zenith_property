// backend/middleware/rbac.js
import User from '../models/User.js';
import logger from '../utils/logger.js';

/**
 * Simple permission check - the main one we actually need
 */
export const checkPermission = (module, action) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user?.id).populate('role');
      
      if (!user?.role) {
        return res.status(403).json({ error: 'No role assigned' });
      }

      // Super admin can do everything
      if (user.role.name === 'super_admin') {
        return next();
      }

      // Check if role has the required permission
      const modulePermission = user.role.permissions.find(p => p.module === module);
      const hasPermission = modulePermission?.actions.includes(action);

      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: `${module}:${action}`,
          userRole: user.role.name
        });
      }

      req.userRole = user.role.name;
      next();

    } catch (error) {
      logger.error(`Permission check error: ${error.message}`);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

/**
 * Simple role check - for when you just need a specific role or higher
 */
export const requireRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user?.id).populate('role');
      
      if (!user?.role) {
        return res.status(403).json({ error: 'No role assigned' });
      }

      // Role hierarchy (lower = higher authority)
      const hierarchy = {
        'super_admin': 1,
        'admin': 2,
        'property_manager': 3,
        'accountant': 4,
        'staff': 5,
        'tenant': 10
      };

      const userLevel = hierarchy[user.role.name];
      const requiredLevel = hierarchy[requiredRole];

      if (userLevel > requiredLevel) {
        return res.status(403).json({ 
          error: 'Insufficient role level',
          required: requiredRole,
          current: user.role.name
        });
      }

      req.userRole = user.role.name;
      next();

    } catch (error) {
      logger.error(`Role check error: ${error.message}`);
      res.status(500).json({ error: 'Role check failed' });
    }
  };
};

export default { checkPermission, requireRole };