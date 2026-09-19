import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Authentication Endpoints
router.post('/register', register);
router.post('/login', login);

// Protected User Profile Endpoint
router.get('/me', protect, getMe);

// RBAC Verification / Audit Endpoint
router.get('/admin-check', protect, adminOnly, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authorized: You have accessed a strict Admin-only endpoint.',
    officer: {
      name: req.user.name,
      badgeId: req.user.badgeId,
      role: req.user.role,
      region: req.user.region,
    },
  });
});

export default router;
