import express from 'express';
import {
  createInspection,
  getMyReports,
  getAllReports,
  getInspectionAnalytics,
  getReportById,
} from '../controllers/inspectionController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication guard to all inspection endpoints
router.use(protect);

// 1. Core Inspection Recording Route (Officers / Admins)
router.post('/', createInspection);

// 2. Officer-Specific History (Only their own reports)
router.get('/my-reports', getMyReports);

// 3. National Admin Intelligence (Admin Only with State/Region filters)
router.get('/all-reports', adminOnly, getAllReports);

// 4. Analytics & Compliance Overview
router.get('/analytics', getInspectionAnalytics);

// 5. Single Dossier by ID
router.get('/:id', getReportById);

export default router;
