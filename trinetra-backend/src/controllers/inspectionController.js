import mongoose from 'mongoose';
import Report from '../models/Report.js';

/**
 * @desc    Create and record a new inspection dossier from OCR scan
 * @route   POST /api/inspections
 * @access  Private (Authenticated Field Officers & Admins)
 */
export const createInspection = async (req, res, next) => {
  try {
    const {
      docketId,
      extractedText,
      verdict,
      missingFields,
      reasonsForFailure,
      productName,
      brand,
      category,
      pdfDocumentUrl,
      pdfUrl,
      imageUrl,
      ocrConfidence,
      findings,
      violations,
      location,
      region,
    } = req.body;

    // 1. Mandatory Validation
    if (!extractedText || !extractedText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Extracted OCR packaging text is required to record an inspection',
      });
    }

    const rawVerdict = verdict || req.body.complianceStatus;
    const validVerdicts = ['Compliant', 'Non-Compliant', 'Manual Review', 'COMPLIANT', 'NON_COMPLIANT', 'MANUAL_REVIEW'];

    if (!rawVerdict || !validVerdicts.includes(rawVerdict)) {
      return res.status(400).json({
        success: false,
        message: "A valid statutory verdict or complianceStatus ('Compliant', 'Non-Compliant', 'Manual Review', 'COMPLIANT', 'NON_COMPLIANT', 'MANUAL_REVIEW') is required",
      });
    }

    // Normalize verdict string to standard title case
    let normalizedVerdict = rawVerdict;
    if (rawVerdict === 'COMPLIANT') normalizedVerdict = 'Compliant';
    else if (rawVerdict === 'NON_COMPLIANT') normalizedVerdict = 'Non-Compliant';
    else if (rawVerdict === 'MANUAL_REVIEW') normalizedVerdict = 'Manual Review';

    // 2. Strict 2011 Rules Consistency Guard:
    // If any mandatory field is missing, verdict must be strictly Non-Compliant.
    // If only Rule 11 (Unit Sale Price) is missing, route to Manual Review instead of Non-Compliant.
    const normalizedMissing = Array.isArray(missingFields) ? missingFields : [];
    const isOnlyUspMissing =
      normalizedMissing.length === 1 &&
      (normalizedMissing[0].toLowerCase().includes('unit sale price') ||
        normalizedMissing[0].toLowerCase().includes('usp') ||
        normalizedMissing[0].toLowerCase().includes('rule 11'));

    let finalVerdict = normalizedVerdict;
    if (normalizedMissing.length > 0) {
      if (isOnlyUspMissing && (normalizedVerdict === 'Manual Review' || req.body.complianceStatus === 'MANUAL_REVIEW')) {
        finalVerdict = 'Manual Review';
      } else {
        finalVerdict = 'Non-Compliant';
      }
    }

    const complianceStatus =
      req.body.complianceStatus ||
      (finalVerdict === 'Compliant'
        ? 'COMPLIANT'
        : finalVerdict === 'Non-Compliant'
        ? 'NON_COMPLIANT'
        : 'MANUAL_REVIEW');

    // 3. Automatically link to authenticated Officer credentials from JWT
    const officerId = req.user?.badgeId || req.user?.username || 'UNKNOWN-OFFICER';
    const officerName = req.user?.name || 'Field Officer';
    const assignedRegion = region || req.user?.region || 'Gujarat';
    const officerRef = req.user?._id || req.user?.id;

    // 4. Create and persist the report in MongoDB
    const report = await Report.create({
      docketId: docketId ? String(docketId).trim().toUpperCase() : undefined,
      officer: officerRef,
      officerId,
      officerName,
      region: assignedRegion,
      location: location || `${assignedRegion} Circle, Field Unit`,
      productName: productName || 'Inspected Packaged Commodity',
      brand: brand || 'Domestic Manufacturer',
      category: category || 'Food & Beverages',
      extractedText: String(extractedText).trim(),
      rawOcrText: req.body.rawOcrText || String(extractedText).trim(),
      missingFields: normalizedMissing,
      reasonsForFailure: Array.isArray(reasonsForFailure) ? reasonsForFailure : [],
      verdict: finalVerdict,
      complianceStatus,
      reanalysisCount: Number(req.body.reanalysisCount) || 0,
      pdfDocumentUrl: pdfDocumentUrl || pdfUrl || null,
      imageUrl: imageUrl || null,
      ocrConfidence: ocrConfidence ? String(ocrConfidence) : '95%',
      findings: findings || '',
      violations: Array.isArray(violations) ? violations : [],
      suggestedUsp: req.body.suggestedUsp || req.body.autoCalculatedUsp || null,
    });

    return res.status(201).json({
      success: true,
      message: 'Statutory inspection dossier recorded successfully',
      report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get inspection history for the logged-in officer only
 * @route   GET /api/inspections/my-reports
 * @access  Private (Authenticated Officer)
 */
export const getMyReports = async (req, res, next) => {
  try {
    const { verdict, search, limit = 50, page = 1 } = req.query;

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    // Query specifically for the authenticated officer (by ObjectId or Badge ID)
    const query = {
      $or: [
        { officer: req.user?._id || req.user?.id },
        { officerId: req.user?.badgeId },
      ],
    };

    // Filter by verdict if provided
    if (verdict && ['Compliant', 'Non-Compliant', 'Manual Review'].includes(verdict)) {
      query.verdict = verdict;
    }

    // Keyword search in product name, brand, or extracted text
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$and = [
        {
          $or: [
            { productName: regex },
            { brand: regex },
            { extractedText: regex },
          ],
        },
      ];
    }

    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      Report.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: reports.length,
      total,
      page: parsedPage,
      pages: Math.ceil(total / parsedLimit) || 1,
      officer: {
        badgeId: req.user?.badgeId,
        name: req.user?.name,
        region: req.user?.region,
      },
      reports,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all inspection reports across the nation with state-level filtering
 * @route   GET /api/inspections/all-reports
 * @access  Private (Admins Only via adminOnly middleware)
 */
export const getAllReports = async (req, res, next) => {
  try {
    const {
      region,
      state,
      verdict,
      officerId,
      search,
      limit = 100,
      page = 1,
    } = req.query;

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 200);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const query = {};

    // Filter by State / Region (accepts either 'region' or 'state')
    const targetRegion = (region || state || '').trim();
    if (targetRegion && targetRegion !== 'All') {
      query.region = new RegExp(`^${targetRegion}$`, 'i');
    }

    // Filter by statutory verdict
    if (verdict && verdict !== 'All' && ['Compliant', 'Non-Compliant', 'Manual Review'].includes(verdict)) {
      query.verdict = verdict;
    }

    // Filter by specific officer badge ID
    if (officerId && officerId.trim()) {
      query.officerId = officerId.trim().toUpperCase();
    }

    // Text search over product name, brand, or extracted text
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { docketId: regex },
        { productName: regex },
        { brand: regex },
        { officerName: regex },
        { officerId: regex },
        { extractedText: regex },
      ];
    }

    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      Report.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: reports.length,
      total,
      page: parsedPage,
      pages: Math.ceil(total / parsedLimit) || 1,
      filters: {
        region: targetRegion || 'All',
        verdict: verdict || 'All',
      },
      reports,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get aggregate analytics & compliance metrics
 * @route   GET /api/inspections/analytics
 * @access  Private (Authenticated Users)
 */
export const getInspectionAnalytics = async (req, res, next) => {
  try {
    const { region } = req.query;
    const match = {};

    if (region && region !== 'All') {
      match.region = new RegExp(`^${region.trim()}$`, 'i');
    }

    // For Field Officers without explicit region query, default to their region
    if (req.user?.role !== 'Admin' && !region) {
      match.region = new RegExp(`^${req.user?.region}$`, 'i');
    }

    const [verdictStats, stateBreakdown, totalCount] = await Promise.all([
      Report.aggregate([
        { $match: match },
        { $group: { _id: '$verdict', count: { $sum: 1 } } },
      ]),
      Report.aggregate([
        { $group: { _id: '$region', total: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 10 },
      ]),
      Report.countDocuments(match),
    ]);

    let compliantCount = 0;
    let nonCompliantCount = 0;
    let manualReviewCount = 0;

    verdictStats.forEach((item) => {
      if (item._id === 'Compliant') compliantCount = item.count;
      if (item._id === 'Non-Compliant') nonCompliantCount = item.count;
      if (item._id === 'Manual Review') manualReviewCount = item.count;
    });

    const complianceRate =
      totalCount > 0 ? ((compliantCount / totalCount) * 100).toFixed(1) + '%' : '100%';

    return res.status(200).json({
      success: true,
      analytics: {
        totalInspections: totalCount,
        compliantCount,
        nonCompliantCount,
        manualReviewCount,
        complianceRate,
        topRegions: stateBreakdown.map((s) => ({ region: s._id, count: s.total })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single inspection report by ID
 * @route   GET /api/inspections/:id
 * @access  Private (Officer who created it or Admin)
 */
export const getReportById = async (req, res, next) => {
  try {
    const isMongoId = mongoose.Types.ObjectId.isValid(req.params.id);
    const report = isMongoId
      ? await Report.findById(req.params.id)
      : await Report.findOne({ docketId: req.params.id.toUpperCase() });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: `No inspection report found with ID: ${req.params.id}`,
      });
    }

    // Ensure Field Officers can only view their own reports; Admins can view any
    if (
      req.user.role !== 'Admin' &&
      report.officerId !== req.user.badgeId &&
      String(report.officer) !== String(req.user._id || req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You do not have permission to access this dossier',
      });
    }

    return res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createInspection,
  getMyReports,
  getAllReports,
  getInspectionAnalytics,
  getReportById,
};
