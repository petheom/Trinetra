import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
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
      required: [true, 'Extracted OCR packaging text is required'],
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
        values: ['Compliant', 'Non-Compliant'],
        message: '{VALUE} is not a valid statutory verdict. Must be Compliant or Non-Compliant',
      },
      required: [true, 'Compliance verdict is required'],
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
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup by state region, officer, and verdict
reportSchema.index({ region: 1, createdAt: -1 });
reportSchema.index({ officerId: 1, createdAt: -1 });
reportSchema.index({ verdict: 1 });

const Report = mongoose.model('Report', reportSchema);

export default Report;
