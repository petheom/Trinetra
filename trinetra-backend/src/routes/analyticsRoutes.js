import express from 'express';
import { getRegionalAnalytics } from '../controllers/analyticsController.js';

const router = express.Router();

// GET /api/analytics/regions - Live MongoDB aggregation by region/jurisdiction
router.get('/regions', getRegionalAnalytics);

export default router;
