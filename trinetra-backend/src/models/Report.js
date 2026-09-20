import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    docketId: {
      type: String,
      trim: true,
      uppercase: true,
      default: () => `TRN-${Math.floor(1000 + Math.random() * 9000)}`,
    },
    officer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    officerId: {
      type: String,
      required: [true, 'Officer Badge ID is required'],
      trim: true,
      uppercase: true,
    },
    officerName: {
      type: String,
      required: [true, 'Officer Name is required'],
      trim: true,
    },
    region: {
      type: String,
      required: [true, 'Inspection region/state is required'],
      trim: true,
    },
    location: {
      type: String,
      default: 'Field Inspection Terminal',
    },
    // Manual Inspection / On-site Verification Fields
    shopName: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    equipmentChecked: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pass', 'Fail', 'Pending', 'Compliant', 'Non-Compliant'],
      default: 'Pass',
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    productName: {
      type: String,
      default: 'Packaged Commodity',
      trim: true,
    },
    brand: {
      type: String,
      default: 'Domestic Manufacturer',
      trim: true,
    },
    category: {
      type: String,
      default: 'Food & Beverages',
      trim: true,
    },
    extractedText: {
      type: String,
      default: '',
    },
    missingFields: {
      type: [String],
      default: [],
    },
    reasonsForFailure: {
      type: [String],
      default: [],
    },
    verdict: {
      type: String,
      enum: {
        values: ['Compliant', 'Non-Compliant', 'Manual Review', 'COMPLIANT', 'NON_COMPLIANT', 'MANUAL_REVIEW'],
        message: '{VALUE} is not a valid statutory verdict.',
      },
      default: 'Compliant',
    },
    complianceStatus: {
      type: String,
      enum: {
        values: ['COMPLIANT', 'NON_COMPLIANT', 'MANUAL_REVIEW'],
        message: '{VALUE} is not a valid compliance status. Must be COMPLIANT, NON_COMPLIANT, or MANUAL_REVIEW',
      },
      default: 'COMPLIANT',
    },
    rawOcrText: {
      type: String,
      default: '',
    },
    reanalysisCount: {
      type: Number,
      default: 0,
    },
    pdfDocumentUrl: {
      type: String,
      default: null,
      trim: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    ocrConfidence: {
      type: String,
      default: '95%',
    },
    findings: {
      type: String,
      default: '',
    },
    violations: {
      type: [String],
      default: [],
    },
    suggestedUsp: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate hook to keep verdict & complianceStatus synchronized
reportSchema.pre('validate', function (next) {
  if (this.complianceStatus && !this.verdict) {
    if (this.complianceStatus === 'COMPLIANT') this.verdict = 'Compliant';
    else if (this.complianceStatus === 'NON_COMPLIANT') this.verdict = 'Non-Compliant';
    else if (this.complianceStatus === 'MANUAL_REVIEW') this.verdict = 'Manual Review';
  } else if (this.verdict && !this.complianceStatus) {
    const v = String(this.verdict).toUpperCase();
    if (v.includes('NON')) this.complianceStatus = 'NON_COMPLIANT';
    else if (v.includes('REVIEW') || v.includes('MANUAL')) this.complianceStatus = 'MANUAL_REVIEW';
    else this.complianceStatus = 'COMPLIANT';
  }

  if (this.extractedText && !this.rawOcrText) {
    this.rawOcrText = this.extractedText;
  } else if (this.rawOcrText && !this.extractedText) {
    this.extractedText = this.rawOcrText;
  }
  next();
});

// Indexes for fast lookup by docketId, state region, officer, and verdict
reportSchema.index({ docketId: 1 });
reportSchema.index({ region: 1, createdAt: -1 });
reportSchema.index({ officerId: 1, createdAt: -1 });
reportSchema.index({ verdict: 1 });

const Report = mongoose.model('Report', reportSchema);

export default Report;
