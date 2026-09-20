import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  authAPI,
  inspectionAPI,
  reportAPI,
  mapBackendReportToFrontend,
  type CreateInspectionPayload,
  type CreateReportPayload,
} from '../utils/api';
import ToastContainer, { type ToastItem } from '../components/Toast';

export type UserRole = 'Admin' | 'Field Officer';

export interface Officer {
  id?: string;
  badgeId: string;
  name: string;
  region: string;
  role: UserRole;
}

export interface InspectionReport {
  id: string;
  _id?: string;
  docketId?: string;
  shopName?: string;
  address?: string;
  equipmentChecked?: string;
  status?: 'Pass' | 'Fail' | 'Pending' | 'Compliant' | 'Non-Compliant';
  remarks?: string;
  productName: string;
  brand: string;
  category: string;
  inspectionDate: string;
  officerName: string;
  officerId: string;
  region: string;
  location: string;
  verdict: 'Compliant' | 'Non-Compliant' | 'Manual Review' | 'COMPLIANT' | 'NON_COMPLIANT' | 'MANUAL_REVIEW';
  complianceStatus?: 'COMPLIANT' | 'NON_COMPLIANT' | 'MANUAL_REVIEW';
  rawOcrText?: string;
  reanalysisCount?: number;
  violations?: string[];
  missingFields?: string[];
  reasonsForFailure?: string[];
  findings: string;
  ocrConfidence: string;
  imageUrl?: string | null;
  pdfDocumentUrl?: string | null;
  suggestedUsp?: string | null;
  autoCalculatedUsp?: string | null;
  createdAt?: string;
}

interface TriNetraContextType {
  officer: Officer | null;
  token: string | null;
  isLoadingAuth: boolean;
  login: (
    badgeId: string,
    name: string,
    region: string,
    role?: UserRole,
    jwtToken?: string
  ) => void;
  logout: () => void;
  reports: InspectionReport[];
  isLoadingReports: boolean;
  reportsError: string | null;
  fetchReports: (options?: { region?: string; verdict?: string; search?: string }) => Promise<void>;
  submitInspection: (payload: CreateInspectionPayload) => Promise<InspectionReport>;
  submitReport: (payload: import('../utils/api').CreateReportPayload) => Promise<InspectionReport>;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  addReport: (
    report: Omit<InspectionReport, 'id' | 'inspectionDate' | 'officerName' | 'officerId' | 'region'> & {
      id?: string;
      inspectionDate?: string;
      officerName?: string;
      officerId?: string;
      region?: string;
    }
  ) => InspectionReport;
}

const TriNetraContext = createContext<TriNetraContextType | undefined>(undefined);

export function TriNetraProvider({ children }: { children: React.ReactNode }) {
  // Toast notifications state
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // JWT Token State
  const [token, setToken] = useState<string | null>(() => {
    try {
      return (
        localStorage.getItem('token') ||
        sessionStorage.getItem('token') ||
        localStorage.getItem('trinetra_jwt') ||
        null
      );
    } catch {
      return null;
    }
  });

  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Officer Profile State
  const [officer, setOfficer] = useState<Officer | null>(() => {
    try {
      const active = localStorage.getItem('activeSession') || localStorage.getItem('trinetra_officer');
      if (active) {
        const parsed = JSON.parse(active);
        if (parsed && typeof parsed === 'object' && parsed.badgeId) {
          const safeRole: UserRole = parsed.role === 'Admin' ? 'Admin' : 'Field Officer';
          const safeRegion: string =
            typeof parsed.region === 'string' && parsed.region.trim()
              ? parsed.region.trim()
              : 'Gujarat';

          return {
            id: parsed.id || parsed._id,
            badgeId: String(parsed.badgeId).trim(),
            name: String(parsed.name || 'Enforcement Officer').trim(),
            region: safeRegion,
            role: safeRole,
          };
        }
      }
      return null;
    } catch (err) {
      console.warn('Failed to parse officer session from storage:', err);
      return null;
    }
  });

  // State: inspection reports loaded directly from MongoDB
  const [reports, setReports] = useState<InspectionReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);

  // Sync token to localStorage and update api headers
  useEffect(() => {
    try {
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('trinetra_jwt', token);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('trinetra_jwt');
      }
    } catch (e) {
      console.warn('Failed to persist token:', e);
    }
  }, [token]);

  // Sync officer to localStorage
  useEffect(() => {
    try {
      if (officer) {
        localStorage.setItem('activeSession', JSON.stringify(officer));
        localStorage.setItem('trinetra_officer', JSON.stringify(officer));
      } else {
        localStorage.removeItem('activeSession');
        localStorage.removeItem('trinetra_officer');
      }
    } catch (e) {
      console.warn('Failed to persist activeSession in localStorage:', e);
    }
  }, [officer]);

  // Sync reports to localStorage for caching
  useEffect(() => {
    try {
      if (reports && reports.length > 0) {
        localStorage.setItem('trinetra_reports', JSON.stringify(reports));
      }
    } catch (e) {
      console.warn('Failed to persist reports in localStorage:', e);
    }
  }, [reports]);

  // Verify auth session on initial load if token is present
  useEffect(() => {
    let isMounted = true;
    const verifySession = async () => {
      if (!token) {
        if (isMounted) setIsLoadingAuth(false);
        return;
      }

      try {
        const data = await authAPI.getMe();
        if (data && data.success && data.user && isMounted) {
          setOfficer({
            id: data.user.id || data.user._id,
            badgeId: data.user.badgeId,
            name: data.user.name,
            region: data.user.region || 'Gujarat',
            role: data.user.role === 'Admin' ? 'Admin' : 'Field Officer',
          });
        }
      } catch (err) {
        console.warn('[Session Verification] Server unreachable or token expired:', err);
      } finally {
        if (isMounted) setIsLoadingAuth(false);
      }
    };

    verifySession();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Login handler
  const login = (
    badgeId: string,
    name: string,
    region: string,
    role: UserRole = 'Field Officer',
    jwtToken?: string
  ) => {
    const newOfficer: Officer = { badgeId, name, region, role };
    setOfficer(newOfficer);

    if (jwtToken) {
      setToken(jwtToken);
    }

    try {
      localStorage.setItem('activeSession', JSON.stringify(newOfficer));
      localStorage.setItem('trinetra_officer', JSON.stringify(newOfficer));
      localStorage.setItem('role', role);
      localStorage.setItem('userRole', role);
      localStorage.setItem('badgeId', badgeId);
      if (jwtToken) {
        localStorage.setItem('token', jwtToken);
      }
    } catch (e) {
      console.warn('Failed to write activeSession:', e);
    }
  };

  // Logout handler
  const logout = () => {
    setOfficer(null);
    setToken(null);
    try {
      localStorage.removeItem('activeSession');
      localStorage.removeItem('trinetra_officer');
      localStorage.removeItem('role');
      localStorage.removeItem('userRole');
      localStorage.removeItem('badgeId');
      localStorage.removeItem('token');
      localStorage.removeItem('trinetra_jwt');
    } catch (e) {
      console.warn('Failed to clear activeSession:', e);
    }
    showToast('Signed out of National Metrology Grid', 'info');
  };

  /**
   * Fetch live inspection reports from Node.js backend:
   * - If Admin -> GET /api/inspections/all-reports
   * - If Officer -> GET /api/inspections/my-reports
   */
  const fetchReports = useCallback(
    async (options?: { region?: string; verdict?: string; search?: string }) => {
      if (!token) return;

      setIsLoadingReports(true);
      setReportsError(null);

      try {
        // Use dedicated reportAPI (/api/reports) to fetch live MongoDB reports
        const res = await reportAPI.getReports({
          search: options?.search,
          limit: 100,
        });

        if (res && res.success && Array.isArray(res.reports)) {
          const mapped = res.reports.map(mapBackendReportToFrontend);
          setReports(mapped);
          return;
        }

        // Fallback to inspectionAPI if reports endpoint returns empty
        const isAdmin = officer?.role === 'Admin';
        let fallbackRes;
        if (isAdmin) {
          fallbackRes = await inspectionAPI.getAllReports({
            region: options?.region && options.region !== 'All' ? options.region : undefined,
            verdict: options?.verdict && options.verdict !== 'All' ? options.verdict : undefined,
            search: options?.search,
            limit: 100,
          });
        } else {
          fallbackRes = await inspectionAPI.getMyReports({
            verdict: options?.verdict && options.verdict !== 'All' ? options.verdict : undefined,
            search: options?.search,
            limit: 100,
          });
        }

        if (fallbackRes && fallbackRes.success && Array.isArray(fallbackRes.reports)) {
          const mapped = fallbackRes.reports.map(mapBackendReportToFrontend);
          setReports(mapped);
        }
      } catch (err: any) {
        const errMsg = err?.message || 'Failed to fetch live inspection records from server';
        setReportsError(errMsg);
        console.warn('[Fetch Reports Error]:', errMsg);
        // Show gentle notification without breaking the UI
        showToast(errMsg, 'error');
      } finally {
        setIsLoadingReports(false);
      }
    },
    [token, officer?.role, showToast]
  );

  // Automatically fetch reports whenever authenticated officer changes or logs in
  useEffect(() => {
    if (token && officer) {
      fetchReports();
    }
  }, [token, officer?.badgeId, officer?.role, fetchReports]);

  /**
   * Submit new inspection dossier directly to POST /api/inspections
   */
  const submitInspection = async (payload: CreateInspectionPayload): Promise<InspectionReport> => {
    try {
      const response = await inspectionAPI.createInspection(payload);

      if (response && response.success && response.report) {
        const newReport = mapBackendReportToFrontend(response.report);
        setReports((prev) => [newReport, ...prev]);
        showToast(`Dossier #${newReport.id} successfully registered in National Database`, 'success');
        return newReport;
      }
      throw new Error(response?.message || 'Server rejected inspection submission');
    } catch (err: any) {
      const errMsg = err?.message || 'Network error: Failed to save inspection dossier to server.';
      showToast(errMsg, 'error');
      throw err;
    }
  };

  /**
   * Submit on-site field inspection report directly to POST /api/reports
   */
  const submitReport = async (payload: CreateReportPayload): Promise<InspectionReport> => {
    try {
      const response = await reportAPI.createReport(payload);

      if (response && response.success && response.report) {
        const newReport = mapBackendReportToFrontend(response.report);
        setReports((prev) => [newReport, ...prev]);
        showToast(`Inspection for ${newReport.shopName || newReport.productName} registered successfully in MongoDB!`, 'success');
        return newReport;
      }
      throw new Error(response?.message || 'Server rejected inspection report submission');
    } catch (err: any) {
      const errMsg = err?.message || 'Network error: Failed to save inspection report to server.';
      showToast(errMsg, 'error');
      throw err;
    }
  };

  /**
   * Legacy addReport helper (backward-compatible)
   */
  const addReport = (
    reportData: Omit<InspectionReport, 'id' | 'inspectionDate' | 'officerName' | 'officerId' | 'region'> & {
      id?: string;
      inspectionDate?: string;
      officerName?: string;
      officerId?: string;
      region?: string;
    }
  ): InspectionReport => {
    const newReport: InspectionReport = {
      ...reportData,
      id: reportData.id || `TRN-${Math.floor(1000 + Math.random() * 9000)}`,
      inspectionDate: reportData.inspectionDate || 'Today',
      officerName: reportData.officerName || officer?.name || 'Inspector Rajesh Varma',
      officerId: reportData.officerId || officer?.badgeId || 'INSP-GJ-2041',
      region: reportData.region || officer?.region || 'Ahmedabad',
    };

    setReports((prev) => [newReport, ...prev]);
    return newReport;
  };

  return (
    <TriNetraContext.Provider
      value={{
        officer,
        token,
        isLoadingAuth,
        login,
        logout,
        reports,
        isLoadingReports,
        reportsError,
        fetchReports,
        submitInspection,
        submitReport,
        showToast,
        addReport,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </TriNetraContext.Provider>
  );
}

export function useTriNetra() {
  const context = useContext(TriNetraContext);
  if (!context) {
    throw new Error('useTriNetra must be used within a TriNetraProvider');
  }
  return context;
}
