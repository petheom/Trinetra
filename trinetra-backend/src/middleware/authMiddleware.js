import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect routes - Verifies JWT in Authorization header (Bearer <token>)
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify JWT signature
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'trinetra_enterprise_super_secret_jwt_key_2026_metrology_secure'
      );

      // Attach user from database without password
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        // If user was removed or offline fallback, attach decoded token payload
        req.user = {
          _id: decoded.id,
          id: decoded.id,
          name: decoded.name,
          badgeId: decoded.badgeId,
          role: decoded.role,
          region: decoded.region,
        };
      } else {
        req.user = user;
      }

      next();
    } catch (error) {
      console.error('[AuthMiddleware] Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized: Token verification failed or expired',
        error: error.message,
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: No Bearer token provided in Authorization header',
    });
  }
};

/**
 * RBAC: Restrict route access strictly to Admin role
 */
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access Denied: Administrative privileges required for this operation',
    userRole: req.user?.role || 'Unknown',
  });
};

/**
 * General RBAC helper for multiple allowed roles
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access Denied: Role '${req.user?.role || 'Guest'}' is not authorized to access this resource`,
      });
    }
    next();
  };
};

export default {
  protect,
  adminOnly,
  authorizeRoles,
};
