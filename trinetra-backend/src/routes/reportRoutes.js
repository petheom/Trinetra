import express from 'express';
import { createReport, getReports } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply JWT authentication protection
router.use(protect);

// POST /api/reports - Create new inspection report (linked to authenticated officer)
router.post('/', createReport);

// GET /api/reports - Get reports (all reports for Admin, or only officer's own reports)
router.get('/', getReports);

export default router;
