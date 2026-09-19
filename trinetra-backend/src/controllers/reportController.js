import Report from '../models/Report.js';

/**
 * @desc    Submit a new Field Inspection Report
 * @route   POST /api/reports
 * @access  Private (Field Officers & Admins)
 */
export const createReport = async (req, res, next) => {
  try {
    const {
      shopName,
      address,
      equipmentChecked,
      status,
      remarks,
      productName,
      brand,
      category,
      region,
      location,
    } = req.body;

    // Validation
    if (!shopName || !shopName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Shop Name is required',
      });
    }

    if (!equipmentChecked || !equipmentChecked.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Equipment Checked is required',
      });
    }

    const normalizedStatus = status === 'Fail' ? 'Fail' : 'Pass';
    const statutoryVerdict = normalizedStatus === 'Pass' ? 'Compliant' : 'Non-Compliant';

    // Link officer from authenticated JWT token
    const officerRef = req.user?._id || req.user?.id;
    const officerId = req.user?.badgeId || req.user?.username || 'INSP-UNKNOWN';
    const officerName = req.user?.name || 'Field Officer';
    const assignedRegion = region || req.user?.region || 'Delhi (NCT)';
    const resolvedLocation = address || location || `${assignedRegion} Circle`;

    const report = await Report.create({
      officer: officerRef,
      officerId,
      officerName,
      region: assignedRegion,
      location: resolvedLocation,
      shopName: shopName.trim(),
      address: address ? address.trim() : '',
      equipmentChecked: equipmentChecked.trim(),
      status: normalizedStatus,
      remarks: remarks ? remarks.trim() : '',
      productName: productName || `${equipmentChecked.trim()} @ ${shopName.trim()}`,
      brand: brand || shopName.trim(),
      category: category || 'Commercial Weights & Measures',
      verdict: statutoryVerdict,
      extractedText: remarks || `On-site statutory verification of ${equipmentChecked} at ${shopName}. Status: ${normalizedStatus}.`,
      findings: remarks || `Equipment verification: ${equipmentChecked} marked as ${normalizedStatus}.`,
      violations: normalizedStatus === 'Fail' ? [remarks || 'Equipment failed accuracy / verification tolerances'] : [],
    });

    return res.status(201).json({
      success: true,
      message: 'Inspection report recorded successfully in MongoDB',
      report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch reports:
 *          - If Admin: returns all reports across all Field Officers
 *          - If Field Officer: returns only reports submitted by this officer
 * @route   GET /api/reports
 * @access  Private (Authenticated Users)
 */
export const getReports = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'Admin';
    const query = {};

    // If Field Officer, strictly constrain to their own reports
    if (!isAdmin) {
      query.$or = [
        { officer: req.user?._id || req.user?.id },
        { officerId: req.user?.badgeId },
      ];
    }

    const { status, search, limit = 100, page = 1 } = req.query;

    if (status && status !== 'All') {
      query.$or = [
        { status: status },
        { verdict: status === 'Pass' ? 'Compliant' : status === 'Fail' ? 'Non-Compliant' : status },
      ];
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { shopName: regex },
        { address: regex },
        { equipmentChecked: regex },
        { docketId: regex },
        { officerName: regex },
        { officerId: regex },
        { productName: regex },
      ];
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 200);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      Report.countDocuments(query),
    ]);

    // Compute live summary statistics for Admin / Officer
    const passCount = await Report.countDocuments({
      ...query,
      $or: [{ status: 'Pass' }, { verdict: 'Compliant' }],
    });
    const failCount = await Report.countDocuments({
      ...query,
      $or: [{ status: 'Fail' }, { verdict: 'Non-Compliant' }],
    });

    return res.status(200).json({
      success: true,
      count: reports.length,
      total,
      stats: {
        totalReports: total,
        totalPassed: passCount,
        totalFailed: failCount,
      },
      reports,
    });
  } catch (error) {
    next(error);
  }
};
