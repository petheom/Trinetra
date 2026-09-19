import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve current directory and load .env from backend root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import User from '../src/models/User.js';
import Report from '../src/models/Report.js';

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/trinetra';

/**
 * Terminal visualizer and automated seeding script for TriNetra Database
 */
async function runDbViewer() {
  console.log('\n======================================================================');
  console.log('       TRINETRA LEGAL METROLOGY SYSTEM - DATABASE RECORD VIEWER       ');
  console.log('======================================================================');
  console.log(`[*] Connecting to MongoDB at: ${MONGO_URI}\n`);

  try {
    // 1. Establish database connection
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('[\x1b[32m✔\x1b[0m] Successfully connected to MongoDB.');

    // 2. Check collections and seed initial data if empty
    const userCount = await User.countDocuments();
    const reportCount = await Report.countDocuments();

    let officerPetheOm = await User.findOne({
      $or: [{ name: /pethe om/i }, { badgeId: 'INSP-AHM-01' }],
    });

    if (!officerPetheOm) {
      console.log('\n[!] Seeding Field Officer profile for "pethe om" in "Ahmedabad" region...');
      officerPetheOm = await User.create({
        name: 'pethe om',
        badgeId: 'INSP-AHM-01',
        password: 'Password@2026',
        role: 'Field Officer',
        region: 'Ahmedabad',
      });
      console.log(`[\x1b[32m✔\x1b[0m] Officer profile created: ${officerPetheOm.name} (${officerPetheOm.badgeId})`);
    }

    if (reportCount === 0) {
      console.log('[!] Database has 0 inspection reports. Creating initial statutory compliance report...');
      const sampleReport = await Report.create({
        officer: officerPetheOm._id,
        officerId: officerPetheOm.badgeId,
        officerName: officerPetheOm.name,
        region: officerPetheOm.region,
        location: 'Central Supermarket, C.G. Road, Ahmedabad',
        productName: 'Amrit Premium Pure Cow Ghee (1L Tin)',
        brand: 'Amrit Agro Industries',
        category: 'Food & Beverages',
        extractedText:
          'Amrit Premium Pure Cow Ghee. Maximum Retail Price (MRP): Rs 620.00 incl. of all taxes. Net Quantity: 1 Litre. Date of Manufacture: 08/2026. Customer Care: care@amritagro.in, 1800-233-5566. FSSAI Lic. No. 10014021000123.',
        missingFields: [],
        reasonsForFailure: [],
        verdict: 'Compliant',
        ocrConfidence: '98.5%',
        findings:
          'All statutory declarations (MRP, Net Qty, Mfg Date, Customer Care, FSSAI) verified strictly compliant under Legal Metrology Rules, 2011.',
        violations: [],
      });
      console.log(`[\x1b[32m✔\x1b[0m] Initial compliance report created: Docket #${sampleReport.docketId || sampleReport._id}`);
    }

    // 3. Fetch and format USERS collection
    const users = await User.find().sort({ createdAt: -1 }).lean();
    console.log(`\n----------------------------------------------------------------------`);
    console.log(`                    COLLECTION: USERS (${users.length} Records)             `);
    console.log(`----------------------------------------------------------------------`);

    if (users.length === 0) {
      console.log('No user records found.');
    } else {
      const userTableData = users.map((u, index) => ({
        '#': index + 1,
        'User ID': u._id.toString(),
        'Full Name': u.name,
        'Badge ID': u.badgeId,
        Role: u.role,
        Region: u.region,
        'Created Date': u.createdAt
          ? new Date(u.createdAt).toLocaleDateString('en-IN')
          : 'N/A',
      }));
      console.table(userTableData);
    }

    // 4. Fetch and format REPORTS collection
    const reports = await Report.find().sort({ createdAt: -1 }).lean();
    console.log(`\n----------------------------------------------------------------------`);
    console.log(`                  COLLECTION: REPORTS (${reports.length} Records)           `);
    console.log(`----------------------------------------------------------------------`);

    if (reports.length === 0) {
      console.log('No inspection reports found.');
    } else {
      const reportTableData = reports.map((r, index) => {
        const docketId =
          r.docketId ||
          `TRN-${r._id.toString().slice(-4).toUpperCase()}`;

        const missing =
          Array.isArray(r.missingFields) && r.missingFields.length > 0
            ? r.missingFields.join(', ')
            : 'None (Compliant)';

        return {
          '#': index + 1,
          'Docket ID': docketId,
          'Product Inspected': r.productName ? r.productName.slice(0, 28) : 'Commodity',
          'Officer Name': r.officerName || 'Field Officer',
          Region: r.region,
          Verdict: r.verdict === 'Compliant' ? '\x1b[32mCompliant\x1b[0m' : '\x1b[31mNon-Compliant\x1b[0m',
          'Missing Fields': missing,
          Confidence: r.ocrConfidence || 'N/A',
          Date: r.createdAt
            ? new Date(r.createdAt).toLocaleDateString('en-IN')
            : 'Today',
        };
      });
      console.table(reportTableData);
    }

    // 5. Summary Insights
    const compliantReports = reports.filter((r) => r.verdict === 'Compliant').length;
    const nonCompliantReports = reports.filter((r) => r.verdict === 'Non-Compliant').length;

    console.log(`\n============================ DATABASE SUMMARY ============================`);
    console.log(` Total Registered Officers : ${users.length}`);
    console.log(` Total Statutory Dossiers  : ${reports.length}`);
    console.log(` Compliant Records         : ${compliantReports}`);
    console.log(` Non-Compliant Violations  : ${nonCompliantReports}`);
    console.log(`==========================================================================\n`);
  } catch (error) {
    console.error('\n[\x1b[31m✖\x1b[0m] Database Connection / Query Failure:');
    console.error(`    ${error.message}`);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n[Tip] Local MongoDB service is not running on 127.0.0.1:27017.');
      console.log('      Start MongoDB locally with:  net start MongoDB');
      console.log('      Or specify a cloud connection string in trinetra-backend/.env:');
      console.log('      MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/trinetra');
    }
  } finally {
    // 6. Graceful Disconnection
    try {
      await mongoose.disconnect();
      console.log('[\x1b[34mℹ\x1b[0m] Database connection closed cleanly. Exiting.');
    } catch (discErr) {
      console.warn('Warning during disconnection:', discErr.message);
    }
    process.exit(0);
  }
}

// Run standalone viewer
runDbViewer();
