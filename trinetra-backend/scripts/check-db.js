import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve directory paths and load environment variables from backend root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import User from '../src/models/User.js';
import Report from '../src/models/Report.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/trinetra';

/**
 * TriNetra Database Inspection & Targeted Officer Verification Script
 * Principal Database Administrator utility for terminal validation
 */
async function checkDatabase() {
  console.log('\n======================================================================');
  console.log('       TRINETRA ENTERPRISE - TERMINAL DATABASE INSPECTION UTILITY     ');
  console.log('======================================================================');
  console.log(`[Connecting] Target URI: ${MONGO_URI}\n`);

  try {
    // 1. Connect to MongoDB with a controlled timeout
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('[\x1b[32m✔\x1b[0m] MongoDB Connection: ACTIVE & READY');
    console.log(`[*] Host: ${mongoose.connection.host} | Port: ${mongoose.connection.port} | Database: ${mongoose.connection.name}`);

    // 2. Targeted Verification: Look for officer "pethe om" in "Ahmedabad"
    console.log('\n----------------------------------------------------------------------');
    console.log('           TARGETED VERIFICATION: OFFICER PROFILE INTEGRITY           ');
    console.log('----------------------------------------------------------------------');

    let targetOfficer = await User.findOne({
      $and: [
        { name: { $regex: /pethe om/i } },
        { region: { $regex: /Ahmedabad/i } },
      ],
    }).lean();

    if (targetOfficer) {
      console.log('[\x1b[32m✔ ACTIVE RECORD CONFIRMED\x1b[0m] Seeded profile for "pethe om" in "Ahmedabad" verified.');
      console.log(`    • Officer ID:   ${targetOfficer._id}`);
      console.log(`    • Full Name:    ${targetOfficer.name}`);
      console.log(`    • Badge ID:     ${targetOfficer.badgeId}`);
      console.log(`    • Role:         ${targetOfficer.role}`);
      console.log(`    • Region:       ${targetOfficer.region}`);
    } else {
      console.log('[\x1b[33m!\x1b[0m] Officer profile for "pethe om" (Ahmedabad) not found in database.');
      console.log('    Seeding officer profile now to ensure baseline persistence...');
      
      const newOfficer = await User.create({
        name: 'pethe om',
        badgeId: 'INSP-AHM-01',
        password: 'Password@2026',
        role: 'Field Officer',
        region: 'Ahmedabad',
      });

      console.log(`[\x1b[32m✔ SEEDED\x1b[0m] Created officer profile: ${newOfficer.name} [Badge: ${newOfficer.badgeId}]`);
    }

    // 3. Fetch and format USERS collection
    const allUsers = await User.find().sort({ createdAt: -1 }).lean();
    console.log(`\n----------------------------------------------------------------------`);
    console.log(`                 COLLECTION: USERS (${allUsers.length} Total Records)               `);
    console.log('----------------------------------------------------------------------');

    if (allUsers.length === 0) {
      console.log('No user records currently present.');
    } else {
      const userGrid = allUsers.map((user, idx) => ({
        '#': idx + 1,
        'User ID': user._id.toString(),
        'Full Name': user.name,
        'Badge ID': user.badgeId,
        Role: user.role,
        Region: user.region,
        'Created At': user.createdAt
          ? new Date(user.createdAt).toLocaleString('en-IN')
          : 'N/A',
      }));
      console.table(userGrid);
    }

    // 4. Fetch and format REPORTS collection
    const allReports = await Report.find().sort({ createdAt: -1 }).lean();
    console.log(`\n----------------------------------------------------------------------`);
    console.log(`                COLLECTION: REPORTS (${allReports.length} Total Records)             `);
    console.log('----------------------------------------------------------------------');

    if (allReports.length === 0) {
      console.log('No inspection reports recorded yet.');
    } else {
      const reportGrid = allReports.map((rep, idx) => {
        const docket = rep.docketId || `TRN-${rep._id.toString().slice(-4).toUpperCase()}`;
        const missing = Array.isArray(rep.missingFields) && rep.missingFields.length > 0
          ? rep.missingFields.join(', ')
          : 'None (Compliant)';

        return {
          '#': idx + 1,
          Docket: docket,
          Product: rep.productName || 'Standard Package',
          Verdict: rep.verdict === 'Compliant' ? 'COMPLIANT' : 'NON-COMPLIANT',
          Officer: rep.officerName || rep.officerId || 'Inspector',
          Region: rep.region || 'N/A',
          'Missing Rules': missing,
          'OCR Conf.': rep.ocrConfidence || 'N/A',
        };
      });
      console.table(reportGrid);
    }

    console.log('\n======================================================================');
    console.log('[\x1b[32m✔\x1b[0m] Terminal inspection completed successfully.');
    console.log('======================================================================\n');
  } catch (err) {
    console.error('\n[\x1b[31m✖ DATABASE ERROR\x1b[0m] Unable to connect to MongoDB:');
    console.error(`    Message: ${err.message}`);

    if (err.message.includes('ECONNREFUSED')) {
      console.log('\n----------------------------------------------------------------------');
      console.log('                      HOW TO FIX THIS CONNECTION                      ');
      console.log('----------------------------------------------------------------------');
      console.log('1. Make sure MongoDB service is running locally on port 27017:');
      console.log('   In PowerShell / Services, start the MongoDB service, or run:');
      console.log('     net start MongoDB');
      console.log('\n2. OR connect to a free MongoDB Atlas Cloud database:');
      console.log('   Update your .env file with your Atlas connection string:');
      console.log('     MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/trinetra?retryWrites=true&w=majority');
      console.log('----------------------------------------------------------------------\n');
    }
  } finally {
    // 5. Safe Disconnect: Gracefully close the connection so the terminal never hangs
    try {
      await mongoose.disconnect();
      console.log('[\x1b[32m✔\x1b[0m] Database connection gracefully disconnected. Terminal released.\n');
    } catch (disconnectErr) {
      console.error('Error during disconnect:', disconnectErr);
    }
  }
}

// Execute inspection
checkDatabase();
