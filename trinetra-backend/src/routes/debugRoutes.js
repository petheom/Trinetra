import express from 'express';
import { getDebugData } from '../controllers/debugController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/debug/check-data
 * @desc    Fetch aggregated user/report statistics and latest 5 inspections
 * @access  Private (Strictly Admin-Only)
 */
router.get('/check-data', protect, adminOnly, getDebugData);

export default router;
