import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import type { InspectionReport } from '../context/TriNetraContext';

// API Base URL - configurable via Vite env or fallback to Express server port 5000
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Core Axios client for TriNetra Enterprise Portal
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 1. REQUEST INTERCEPTOR:
 * Automatically retrieve and attach the JWT token from storage to Authorization header
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const token =
        localStorage.getItem('token') ||
        sessionStorage.getItem('token') ||
        localStorage.getItem('trinetra_jwt');

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token.trim()}`;
      }
    } catch (err) {
      console.warn('[API Interceptor] Failed to read token from storage:', err);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 2. RESPONSE INTERCEPTOR:
 * Standardize error responses and handle 401 Unauthorized / Token Expiration
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.message ||
      'Unable to connect to TriNetra backend server';

    console.warn(`[API ${status || 'Network Error'}]`, message);

    // If 401 Unauthorized, token is expired or invalid
    if (status === 401) {
      try {
        const currentPath = window.location.pathname;
        // Only trigger token cleanup if not already on public auth pages
        if (currentPath !== '/login' && currentPath !== '/signup' && currentPath !== '/') {
          localStorage.removeItem('token');
          localStorage.removeItem('trinetra_jwt');
          console.warn('[API] Stale session cleared due to 401 Unauthorized');
        }
      } catch {}
    }

    return Promise.reject({
      status,
      message,
      data: error.response?.data,
      response: error.response,
      isAxiosError: true,
    });
  }
);

// -------------------------------------------------------------
// Data Normalizer: Backend Mongo Schema -> Frontend InspectionReport
// -------------------------------------------------------------
export const mapBackendReportToFrontend = (r: any): InspectionReport => {
  if (!r) {
    return {
      id: `TRN-${Math.floor(1000 + Math.random() * 9000)}`,
      productName: 'Inspected Commodity',
      brand: 'Standard Packaged Good',
      category: 'Food & Beverages',
      inspectionDate: 'Today',
      officerName: 'Field Officer',
      officerId: 'INSP-UNKNOWN',
      region: 'Gujarat',
      location: 'Field Terminal',
      verdict: 'Non-Compliant',
      violations: [],
      findings: '',
      ocrConfidence: '90%',
    };
  }

  const rawId =
    r.docketId ||
    (r._id ? `TRN-${String(r._id).slice(-4).toUpperCase()}` : r.id) ||
    `TRN-${Math.floor(1000 + Math.random() * 9000)}`;

  const dateStr = r.createdAt
    ? new Date(r.createdAt).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : r.inspectionDate || 'Today';

  return {
    id: rawId,
    _id: r._id,
    docketId: r.docketId || rawId,
    shopName: r.shopName || '',
    address: r.address || '',
    equipmentChecked: r.equipmentChecked || '',
    status: r.status || (r.verdict === 'Compliant' ? 'Pass' : 'Fail'),
    remarks: r.remarks || r.findings || '',
    productName: r.productName || (r.shopName ? `${r.equipmentChecked || 'Equipment'} @ ${r.shopName}` : 'Inspected Packaged Commodity'),
    brand: r.brand || r.shopName || 'Domestic Manufacturer',
    category: r.category || 'Food & Beverages',
    inspectionDate: dateStr,
    officerName: r.officerName || 'Inspector Rajesh Varma',
    officerId: r.officerId || 'INSP-GJ-2041',
    region: r.region || 'Gujarat',
    location: r.address || r.location || `${r.region || 'State'} Circle, Field Unit`,
    verdict:
      r.verdict === 'Compliant'
        ? 'Compliant'
        : r.verdict === 'Manual Review'
        ? 'Manual Review'
        : 'Non-Compliant',
    violations: Array.isArray(r.violations) ? r.violations : [],
    missingFields: Array.isArray(r.missingFields) ? r.missingFields : [],
    reasonsForFailure: Array.isArray(r.reasonsForFailure) ? r.reasonsForFailure : [],
    findings:
      r.findings ||
      r.remarks ||
      (r.extractedText
        ? `OCR statutory audit conducted on packaging declarations under Rules, 2011.`
        : ''),
    ocrConfidence: r.ocrConfidence ? String(r.ocrConfidence) : '95%',
    imageUrl: r.imageUrl || null,
    pdfDocumentUrl: r.pdfDocumentUrl || null,
    createdAt: r.createdAt,
  };
};

// -------------------------------------------------------------
// Authentication Endpoints (/api/auth)
// -------------------------------------------------------------
export const authAPI = {
  /**
   * Register a new Officer or Admin
   */
  register: async (payload: {
    name: string;
    badgeId: string;
    username?: string;
    password: string;
    role?: 'Admin' | 'Field Officer';
    region?: string;
  }) => {
    const response = await api.post('/api/auth/register', payload);
    return response.data;
  },

  /**
   * Log in with Badge ID / Username, Password, and Role
   */
  login: async (credentials: {
    badgeId?: string;
    username?: string;
    password: string;
    role?: 'Admin' | 'Field Officer';
  }) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },

  /**
   * Fetch currently authenticated officer profile
   */
  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  /**
   * Verify admin role privileges
   */
  checkAdmin: async () => {
    const response = await api.get('/api/auth/admin-check');
    return response.data;
  },
};

// -------------------------------------------------------------
// Dedicated Inspection Report Endpoints (/api/reports)
// -------------------------------------------------------------
export interface CreateReportPayload {
  shopName: string;
  address?: string;
  equipmentChecked: string;
  status: 'Pass' | 'Fail';
  remarks?: string;
  productName?: string;
  brand?: string;
  category?: string;
  region?: string;
  location?: string;
}

export const reportAPI = {
  /**
   * Submit a new field inspection report directly to MongoDB
   */
  createReport: async (payload: CreateReportPayload) => {
    const response = await api.post('/api/reports', payload);
    return response.data;
  },

  /**
   * Fetch inspection reports (all for Admin, or only officer's own for Field Officer)
   */
  getReports: async (params?: {
    status?: string;
    search?: string;
    limit?: number;
    page?: number;
  }) => {
    const response = await api.get('/api/reports', { params });
    return response.data;
  },
};

// -------------------------------------------------------------
// Dedicated Server-Side OCR Scanner Endpoints (/api/scanner)
// -------------------------------------------------------------
export interface ScannerEvaluationField {
  id: string;
  name: string;
  rule: string;
  found: boolean;
  snippet: string | null;
  explanation: string;
}

export interface ScannerApiResponse {
  success: boolean;
  message: string;
  extractedText: string;
  ocrConfidence: string;
  evaluation: {
    isCompliant: boolean;
    verdict: 'Compliant' | 'Non-Compliant';
    confidenceScore: string;
    summary: string;
    foundFields: string[];
    missingFields: string[];
    fields: ScannerEvaluationField[];
  };
}

export const scannerAPI = {
  /**
   * Analyze uploaded image file or base64 using server-side Tesseract.js & 2011 Rules Engine
   */
  analyzeImage: async (imageFileOrBase64: File | string): Promise<ScannerApiResponse> => {
    if (typeof imageFileOrBase64 === 'string') {
      const response = await api.post('/api/scanner/analyze', { image: imageFileOrBase64 });
      return response.data;
    }

    const formData = new FormData();
    formData.append('image', imageFileOrBase64);
    const response = await api.post('/api/scanner/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// -------------------------------------------------------------
// Inspection & Report Endpoints (/api/inspections)
// -------------------------------------------------------------
export interface CreateInspectionPayload {
  extractedText: string;
  verdict: 'Compliant' | 'Non-Compliant';
  missingFields?: string[];
  reasonsForFailure?: string[];
  productName?: string;
  brand?: string;
  category?: string;
  pdfDocumentUrl?: string;
  imageUrl?: string | null;
  ocrConfidence?: string;
  findings?: string;
  violations?: string[];
  location?: string;
  region?: string;
}

export const inspectionAPI = {
  /**
   * Submit and record a new inspection dossier to MongoDB
   */
  createInspection: async (payload: CreateInspectionPayload) => {
    const response = await api.post('/api/inspections', payload);
    return response.data;
  },

  /**
   * Fetch officer's personal inspection history
   */
  getMyReports: async (params?: {
    verdict?: string;
    search?: string;
    limit?: number;
    page?: number;
  }) => {
    const response = await api.get('/api/inspections/my-reports', { params });
    return response.data;
  },

  /**
   * Fetch all global inspections (Admin Only) with State/Region filters
   */
  getAllReports: async (params?: {
    region?: string;
    verdict?: string;
    search?: string;
    limit?: number;
    page?: number;
  }) => {
    const response = await api.get('/api/inspections/all-reports', { params });
    return response.data;
  },

  /**
   * Fetch compliance analytics metrics & regional breakdowns
   */
  getAnalytics: async () => {
    const response = await api.get('/api/inspections/analytics');
    return response.data;
  },

  /**
   * Fetch dynamic regional analytics aggregated directly from MongoDB
   */
  getRegionalAnalytics: async () => {
    const response = await api.get('/api/analytics/regions');
    return response.data;
  },

  /**
   * Fetch a single inspection record by ID
   */
  getReportById: async (id: string) => {
    const response = await api.get(`/api/inspections/${id}`);
    return response.data;
  },
};

export interface RegionMetric {
  region: string;
  jurisdiction?: string;
  state?: string;
  totalAudits: number;
  compliantCount: number;
  violationCount: number;
  reviewCount?: number;
  penalties: number;
  passRate: number;
}

export const analyticsAPI = {
  getRegionalAnalytics: async () => {
    const response = await api.get('/api/analytics/regions');
    return response.data;
  },
};

export default api;
