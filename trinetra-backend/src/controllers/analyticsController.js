import Report from '../models/Report.js';

/**
 * @desc    Get regional analytics grouped by region/jurisdiction from MongoDB
 * @route   GET /api/analytics/regions
 * @access  Public / Authenticated
 */
export const getRegionalAnalytics = async (req, res, next) => {
  try {
    const pipeline = [
      {
        $match: {
          $or: [
            { region: { $exists: true, $ne: null, $nin: ['', ' '] } },
            { jurisdiction: { $exists: true, $ne: null, $nin: ['', ' '] } },
            { state: { $exists: true, $ne: null, $nin: ['', ' '] } },
          ],
        },
      },
      {
        $project: {
          regionName: {
            $trim: {
              input: {
                $ifNull: ['$region', { $ifNull: ['$jurisdiction', '$state'] }],
              },
            },
          },
          verdict: 1,
          status: 1,
          penalties: 1,
          penaltyAmount: 1,
        },
      },
      {
        $match: {
          regionName: { $ne: '' },
        },
      },
      {
        $group: {
          _id: '$regionName',
          totalAudits: { $sum: 1 },
          compliantCount: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$verdict', 'Compliant'] },
                    { $eq: ['$status', 'Pass'] },
                    { $eq: ['$status', 'Compliant'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          violationCount: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$verdict', 'Non-Compliant'] },
                    { $eq: ['$status', 'Fail'] },
                    { $eq: ['$status', 'Non-Compliant'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          reviewCount: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$verdict', 'Manual Review'] },
                    { $eq: ['$status', 'Pending'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          totalPenalties: {
            $sum: {
              $cond: [
                { $gt: ['$penaltyAmount', 0] },
                '$penaltyAmount',
                {
                  $cond: [
                    { $gt: ['$penalties', 0] },
                    '$penalties',
                    {
                      $cond: [
                        {
                          $or: [
                            { $eq: ['$verdict', 'Non-Compliant'] },
                            { $eq: ['$status', 'Fail'] },
                            { $eq: ['$status', 'Non-Compliant'] },
                          ],
                        },
                        25000,
                        0,
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          region: '$_id',
          jurisdiction: '$_id',
          state: '$_id',
          totalAudits: 1,
          compliantCount: 1,
          violationCount: 1,
          reviewCount: 1,
          penalties: '$totalPenalties',
          passRate: {
            $cond: [
              { $gt: ['$totalAudits', 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ['$compliantCount', '$totalAudits'] },
                      100,
                    ],
                  },
                  0,
                ],
              },
              100,
            ],
          },
        },
      },
      {
        $sort: { totalAudits: -1, region: 1 },
      },
    ];

    const regions = await Report.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      count: regions.length,
      regions,
      summary: {
        totalRegions: regions.length,
        totalAudits: regions.reduce((acc, r) => acc + (r.totalAudits || 0), 0),
        totalCompliant: regions.reduce((acc, r) => acc + (r.compliantCount || 0), 0),
        totalViolations: regions.reduce((acc, r) => acc + (r.violationCount || 0), 0),
        totalPenalties: regions.reduce((acc, r) => acc + (r.penalties || 0), 0),
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getRegionalAnalytics,
};
