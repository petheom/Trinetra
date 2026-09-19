import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Set test environment flag before loading app
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_super_secret_for_trinetra_testing_only';

// Import app and models
import app from '../src/server.js';
import User from '../src/models/User.js';
import Report from '../src/models/Report.js';

describe('TriNetra Enterprise API Integration Tests', () => {
  // In-memory mock database stores for testing isolation
  let mockUsers = [];
  let mockReports = [];

  // Reusable token helpers
  const generateTestToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  };

  const mockOfficerUser = {
    _id: '66e123456789abcdef000001',
    name: 'Inspector Vikram Rao',
    badgeId: 'INSP-GJ-9999',
    role: 'Field Officer',
    region: 'Gujarat',
    password: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890TestHashedPassword',
    matchPassword: async (pwd) => pwd === 'securePassword123',
  };

  const mockAdminUser = {
    _id: '66e123456789abcdef000002',
    name: 'Director Amit Trivedi',
    badgeId: 'ADMIN-HQ-01',
    role: 'Admin',
    region: 'Delhi (NCT)',
    password: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890TestHashedPassword',
    matchPassword: async (pwd) => pwd === 'adminSecretPass#2026',
  };

  const officerToken = generateTestToken({
    id: mockOfficerUser._id,
    name: mockOfficerUser.name,
    badgeId: mockOfficerUser.badgeId,
    role: mockOfficerUser.role,
    region: mockOfficerUser.region,
  });

  const adminToken = generateTestToken({
    id: mockAdminUser._id,
    name: mockAdminUser.name,
    badgeId: mockAdminUser.badgeId,
    role: mockAdminUser.role,
    region: mockAdminUser.region,
  });

  beforeEach(() => {
    // Reset in-memory stores
    mockUsers = [{ ...mockOfficerUser }, { ...mockAdminUser }];
    mockReports = [];

    // -------------------------------------------------------------
    // Mock Mongoose User Model Operations (Zero DB modification)
    // -------------------------------------------------------------
    jest.spyOn(User, 'findOne').mockImplementation((query) => {
      const user = mockUsers.find((u) => {
        if (query.badgeId) {
          return u.badgeId.toUpperCase() === String(query.badgeId).toUpperCase();
        }
        return false;
      });
      return Promise.resolve(user || null);
    });

    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const user = mockUsers.find((u) => String(u._id) === String(id));
      return {
        select: jest.fn().mockImplementation(() => {
          if (!user) return Promise.resolve(null);
          const { password, ...safeUser } = user;
          return Promise.resolve(safeUser);
        }),
      };
    });

    jest.spyOn(User, 'create').mockImplementation(async (userData) => {
      const newUser = {
        _id: `66e${Math.random().toString(16).slice(2, 10)}`,
        name: userData.name,
        badgeId: userData.badgeId.toUpperCase(),
        role: userData.role || 'Field Officer',
        region: userData.region || 'Gujarat',
        password: await bcrypt.hash(userData.password, 10),
        matchPassword: async function (candidatePassword) {
          return await bcrypt.compare(candidatePassword, this.password);
        },
      };
      mockUsers.push(newUser);
      return newUser;
    });

    // -------------------------------------------------------------
    // Mock Mongoose Report Model Operations
    // -------------------------------------------------------------
    jest.spyOn(Report, 'create').mockImplementation(async (reportData) => {
      const newReport = {
        _id: `66f${Math.random().toString(16).slice(2, 10)}`,
        docketId: reportData.docketId || `TRN-${Math.floor(1000 + Math.random() * 9000)}`,
        ...reportData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockReports.push(newReport);
      return newReport;
    });

    jest.spyOn(Report, 'findOne').mockImplementation((query) => {
      const report = mockReports.find((r) => {
        if (query.docketId) {
          return String(r.docketId).toUpperCase() === String(query.docketId).toUpperCase();
        }
        return false;
      });
      return Promise.resolve(report || null);
    });

    jest.spyOn(Report, 'findById').mockImplementation((id) => {
      const report = mockReports.find((r) => String(r._id) === String(id));
      return Promise.resolve(report || null);
    });

    jest.spyOn(Report, 'find').mockImplementation(() => {
      const chain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockReports),
      };
      chain.then = (resolve, reject) => Promise.resolve(mockReports).then(resolve, reject);
      return chain;
    });

    jest.spyOn(Report, 'countDocuments').mockImplementation(() => {
      return Promise.resolve(mockReports.length);
    });

    jest.spyOn(User, 'countDocuments').mockImplementation(() => {
      return Promise.resolve(mockUsers.length);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // =============================================================
  // 1. AUTHENTICATION TEST SUITE (/api/auth)
  // =============================================================
  describe('Authentication Endpoints (/api/auth)', () => {
    test('POST /api/auth/register - Successfully registers a new field officer', async () => {
      const newOfficerPayload = {
        name: 'Inspector Sunita Sharma',
        badgeId: 'INSP-MH-7788',
        password: 'securePassword#2026',
        role: 'Field Officer',
        region: 'Maharashtra',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(newOfficerPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.badgeId).toBe('INSP-MH-7788');
      expect(res.body.user.role).toBe('Field Officer');
      expect(res.body.user.region).toBe('Maharashtra');
    });

    test('POST /api/auth/register - Rejects registration when mandatory fields are missing', async () => {
      const invalidPayload = {
        name: 'Incomplete Officer',
        // missing badgeId and password
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidPayload);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Please provide name, badgeId, and password');
    });

    test('POST /api/auth/register - Rejects duplicate Badge ID registration', async () => {
      const duplicatePayload = {
        name: 'Duplicate Officer',
        badgeId: 'INSP-GJ-9999', // Already exists in mockUsers
        password: 'password123',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(duplicatePayload);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already registered');
    });

    test('POST /api/auth/login - Successfully authenticates user and returns JWT token', async () => {
      const loginPayload = {
        badgeId: 'INSP-GJ-9999',
        password: 'securePassword123',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginPayload);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.badgeId).toBe('INSP-GJ-9999');
      expect(res.body.user.name).toBe('Inspector Vikram Rao');

      // Verify that the returned JWT token is valid and decodable
      const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
      expect(decoded.badgeId).toBe('INSP-GJ-9999');
      expect(decoded.role).toBe('Field Officer');
    });

    test('POST /api/auth/login - Rejects login with incorrect password', async () => {
      const wrongPasswordPayload = {
        badgeId: 'INSP-GJ-9999',
        password: 'incorrectPassword123',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(wrongPasswordPayload);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Password does not match');
    });

    test('POST /api/auth/login - Rejects login for non-existent Badge ID', async () => {
      const unknownUserPayload = {
        badgeId: 'UNKNOWN-OFFICER-000',
        password: 'anyPassword123',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(unknownUserPayload);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No account found for Badge ID');
    });
  });

  // =============================================================
  // 2. RBAC ACCESS CONTROL TEST SUITE
  // =============================================================
  describe('RBAC Middleware & Route Protection', () => {
    test('RBAC - Field Officer token is REJECTED with 403 on Admin-only check endpoint', async () => {
      const res = await request(app)
        .get('/api/auth/admin-check')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Administrative privileges required');
    });

    test('RBAC - Field Officer token is REJECTED with 403 on Admin-only /api/inspections/all-reports', async () => {
      const res = await request(app)
        .get('/api/inspections/all-reports')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access Denied');
    });

    test('RBAC - Admin token is ALLOWED (200 OK) on Admin-only endpoints', async () => {
      const res = await request(app)
        .get('/api/auth/admin-check')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.officer.role).toBe('Admin');
    });

    test('Protected Routes - Request WITHOUT token is REJECTED with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/inspections/my-reports');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No Bearer token provided');
    });

    test('Protected Routes - Request with malformed / invalid token is REJECTED with 401', async () => {
      const res = await request(app)
        .get('/api/inspections/my-reports')
        .set('Authorization', 'Bearer invalid.bogus.jwt.token');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Token verification failed');
    });
  });

  // =============================================================
  // 3. INSPECTION ROUTE TEST SUITE (/api/inspections)
  // =============================================================
  describe('Inspection Route & Business Logic (/api/inspections)', () => {
    test('POST /api/inspections - Successfully creates inspection record and links officer credentials', async () => {
      const inspectionPayload = {
        extractedText:
          'Fortune Sunlite Refined Sunflower Oil. MRP Rs 165.00 Net Volume 1L PKD 09/26 Customer Care 1800-200-1122',
        verdict: 'Compliant',
        missingFields: [],
        reasonsForFailure: [],
        productName: 'Fortune Sunlite Refined Sunflower Oil',
        brand: 'Adani Wilmar Ltd',
        category: 'Food & Beverages',
        ocrConfidence: '98%',
        findings: 'All statutory declarations verified compliant under Packaged Commodities Rules 2011.',
      };

      const res = await request(app)
        .post('/api/inspections')
        .set('Authorization', `Bearer ${officerToken}`)
        .send(inspectionPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Statutory inspection dossier recorded successfully');
      expect(res.body.report).toBeDefined();
      expect(res.body.report.officerId).toBe(mockOfficerUser.badgeId);
      expect(res.body.report.officerName).toBe(mockOfficerUser.name);
      expect(res.body.report.region).toBe(mockOfficerUser.region);
      expect(res.body.report.verdict).toBe('Compliant');
    });

    test('POST /api/inspections - Strict 2011 Rules enforce Non-Compliant if missingFields present', async () => {
      const nonCompliantPayload = {
        extractedText: 'Generic Spice Mix. MRP Rs 50. (Mfg Date and Net Qty missing)',
        verdict: 'Compliant', // Even if client accidentally claims compliant
        missingFields: ['Net Weight', 'Mfg Date'],
        reasonsForFailure: ['Rule 6(1)(a) Net Weight absent', 'Rule 6(1)(d) Mfg Date absent'],
        productName: 'Generic Spice Mix',
      };

      const res = await request(app)
        .post('/api/inspections')
        .set('Authorization', `Bearer ${officerToken}`)
        .send(nonCompliantPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      // Backend consistency guard automatically overrides to Non-Compliant
      expect(res.body.report.verdict).toBe('Non-Compliant');
      expect(res.body.report.missingFields).toEqual(['Net Weight', 'Mfg Date']);
    });

    test('POST /api/inspections - Rejects submission when extractedText is missing', async () => {
      const invalidPayload = {
        verdict: 'Compliant',
        // extractedText is empty / missing
      };

      const res = await request(app)
        .post('/api/inspections')
        .set('Authorization', `Bearer ${officerToken}`)
        .send(invalidPayload);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Extracted OCR packaging text is required');
    });

    test('GET /api/inspections/my-reports - Fetches inspection history for authenticated officer', async () => {
      const res = await request(app)
        .get('/api/inspections/my-reports')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.reports)).toBe(true);
    });

    test('GET /api/inspections/all-reports - Admin can access global reports with region filter', async () => {
      const res = await request(app)
        .get('/api/inspections/all-reports?region=Gujarat')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.reports)).toBe(true);
    });

    test('POST /api/inspections - Successfully records inspection with Manual Review verdict and custom docketId', async () => {
      const manualReviewPayload = {
        docketId: 'TRN-7788',
        extractedText: 'Biscuits pack with blurred manufacturing stamp.',
        verdict: 'Manual Review',
        missingFields: [],
        reasonsForFailure: [],
        productName: 'Digestive Biscuits',
        brand: 'WheatCo',
        category: 'Food & Beverages',
        ocrConfidence: '72%',
        findings: 'Referred for secondary optical inspection.',
      };

      const res = await request(app)
        .post('/api/inspections')
        .set('Authorization', `Bearer ${officerToken}`)
        .send(manualReviewPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.report.docketId).toBe('TRN-7788');
      expect(res.body.report.verdict).toBe('Manual Review');
    });

    test('GET /api/inspections/:id - Fetches report by docketId without CastError', async () => {
      mockReports.push({
        _id: '66f123456789abcdef000010',
        docketId: 'TRN-7788',
        officer: mockOfficerUser._id,
        officerId: mockOfficerUser.badgeId,
        productName: 'Digestive Biscuits',
        verdict: 'Manual Review',
        region: 'Gujarat',
      });

      const res = await request(app)
        .get('/api/inspections/TRN-7788')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.report.docketId).toBe('TRN-7788');
      expect(res.body.report.productName).toBe('Digestive Biscuits');
    });
  });

  // =============================================================
  // 4. DEBUG ROUTE TEST SUITE (/api/debug/check-data)
  // =============================================================
  describe('Debug Route & Aggregated Verification (/api/debug)', () => {
    test('GET /api/debug/check-data - Rejects unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/debug/check-data');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('GET /api/debug/check-data - Rejects Field Officer with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/debug/check-data')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access Denied');
    });

    test('GET /api/debug/check-data - Allows Admin and returns aggregated counts and reports', async () => {
      const res = await request(app)
        .get('/api/debug/check-data')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('counts');
      expect(res.body.counts).toHaveProperty('users');
      expect(res.body.counts).toHaveProperty('reports');
      expect(Array.isArray(res.body.latestReports)).toBe(true);
    });
  });
});
