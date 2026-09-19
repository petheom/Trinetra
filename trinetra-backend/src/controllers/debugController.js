import User from '../models/User.js';
import Report from '../models/Report.js';

/**
 * @desc    Aggregate debug data: User and Report counts + latest 5 inspection reports
 * @route   GET /api/debug/check-data
 * @access  Private / Admin Only
 */
export const getDebugData = async (req, res, next) => {
  try {
    // 1. Concurrently fetch total counts and latest 5 reports
    const [userCount, reportCount, latestReports] = await Promise.all([
      User.countDocuments(),
      Report.countDocuments(),
      Report.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('officer', 'name badgeId region role')
        .lean(),
    ]);

    // 2. Return neatly formatted JSON payload
    return res.status(200).json({
      success: true,
      service: 'TriNetra Database Diagnostic & Verification Gateway',
      timestamp: new Date().toISOString(),
      requestedBy: {
        userId: req.user?._id || req.user?.id,
        badgeId: req.user?.badgeId,
        role: req.user?.role,
        region: req.user?.region,
      },
      counts: {
        users: userCount,
        reports: reportCount,
      },
      latestReports,
    });
  } catch (error) {
    console.error('[DebugController] Error aggregating debug database records:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve debug database dump',
      error: error.message,
    });
  }
};

export default {
  getDebugData,
};
