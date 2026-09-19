import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  Shield,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Database,
  Eye,
  SlidersHorizontal,
  FileCheck2,
} from 'lucide-react';
import { useTriNetra } from '../context/TriNetraContext';
import { API_BASE_URL } from '../utils/api';

interface InspectionReportRecord {
  _id: string;
  docketId?: string;
  officerId?: string;
  officerName?: string;
  region?: string;
  location?: string;
  productName?: string;
  brand?: string;
  category?: string;
  extractedText?: string;
  missingFields?: string[];
  reasonsForFailure?: string[];
  verdict: 'Compliant' | 'Non-Compliant' | 'Manual Review';
  ocrConfidence?: string;
  findings?: string;
  pdfDocumentUrl?: string;
  createdAt: string;
  updatedAt?: string;
  officer?: {
    _id?: string;
    name?: string;
    badgeId?: string;
    role?: string;
    region?: string;
  };
}

export default function AdminDashboard() {
  const { showToast } = useTriNetra();

  const [reports, setReports] = useState<InspectionReportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Compliant' | 'Non-Compliant'>('All');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [selectedReport, setSelectedReport] = useState<InspectionReportRecord | null>(null);

  /**
   * Fetch live inspection reports from the backend using axios + JWT
   */
  const fetchAllReports = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      // 1. Retrieve the JWT authentication token from storage
      const token =
        localStorage.getItem('token') ||
        sessionStorage.getItem('token') ||
        localStorage.getItem('trinetra_jwt');

      // 2. Call GET /api/inspections/all-reports with Bearer Authorization header
      const response = await axios.get(`${API_BASE_URL}/api/inspections/all-reports`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token.trim()}` } : {}),
        },
        timeout: 10000,
      });

      if (response.data && response.data.success && Array.isArray(response.data.reports)) {
        setReports(response.data.reports);
      } else if (Array.isArray(response.data)) {
        setReports(response.data);
      } else {
        setReports([]);
      }

      if (isManualRefresh) {
        showToast('Live database records refreshed successfully', 'success');
      }
    } catch (err: unknown) {
      console.error('[AdminDashboard] Error fetching live reports:', err);
      let msg = 'Failed to load inspection records from server.';
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          msg = 'Access Denied: Admin authorization credentials required to query global data grid.';
        } else if (err.code === 'ECONNABORTED' || err.message.includes('Network Error')) {
          msg = 'Network Error: Cannot connect to Node.js backend on port 5000. Ensure server is running.';
        } else if (err.response?.data?.message) {
          msg = err.response.data.message;
        }
      }
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  // Initial fetch on component mount
  useEffect(() => {
    fetchAllReports();
  }, [fetchAllReports]);

  // Distinct region list for dropdown
  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      const reg = r.region || r.officer?.region;
      if (reg) set.add(reg);
    });
    return Array.from(set).sort();
  }, [reports]);

  // Filtered & Searched Reports
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const officerName = report.officerName || report.officer?.name || '';
      const region = report.region || report.officer?.region || '';
      const product = report.productName || '';
      const docket = report.docketId || report._id || '';

      const matchesSearch =
        searchQuery.trim() === '' ||
        officerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.toLowerCase().includes(searchQuery.toLowerCase()) ||
        docket.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'All' || report.verdict === statusFilter;

      const matchesRegion =
        regionFilter === 'All' || region.toLowerCase() === regionFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesRegion;
    });
  }, [reports, searchQuery, statusFilter, regionFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = reports.length;
    const compliant = reports.filter((r) => r.verdict === 'Compliant').length;
    const nonCompliant = reports.filter((r) => r.verdict === 'Non-Compliant').length;
    const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 0;
    return { total, compliant, nonCompliant, complianceRate };
  }, [reports]);

  return (
    <div className="w-full space-y-6 pb-14 animate-in fade-in duration-300">
      {/* 1. Header Banner & Actions */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
            <Shield className="h-3.5 w-3.5" />
            <span>National Metrology Enforcement Directorate</span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Admin Central Inspection Data Grid
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Real-time pan-India statutory packaging audit dossiers under Legal Metrology Rules, 2011.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchAllReports(true)}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition active:scale-95 disabled:opacity-60 cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Live Data'}</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Metric Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Records</span>
            <Database className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{metrics.total}</p>
          <span className="text-[11px] text-slate-400">Inspections logged</span>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-bold uppercase tracking-wider">Compliant (Pass)</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-950">{metrics.compliant}</p>
          <span className="text-[11px] text-emerald-700">Zero infractions detected</span>
        </div>

        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-xs font-bold uppercase tracking-wider">Non-Compliant (Fail)</span>
            <XCircle className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-950">{metrics.nonCompliant}</p>
          <span className="text-[11px] text-rose-700">Violations flagged</span>
        </div>

        <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between text-indigo-700">
            <span className="text-xs font-bold uppercase tracking-wider">Adherence Rate</span>
            <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-indigo-950">{metrics.complianceRate}%</p>
          <span className="text-[11px] text-indigo-700">Statutory pass percentage</span>
        </div>
      </div>

      {/* 3. Search & Multi-Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Officer name, Region, Product, or Docket ID..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50/60 py-2 pl-9 pr-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
          />
        </div>

        {/* Filter Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Compliant' | 'Non-Compliant')}
              className="rounded-xl border border-slate-300 bg-white py-1.5 px-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:border-slate-400 focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Compliant">Compliant Only</option>
              <option value="Non-Compliant">Non-Compliant Only</option>
            </select>
          </div>

          {/* Region Filter */}
          {availableRegions.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Region:</span>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white py-1.5 px-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:border-slate-400 focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="All">All Regions</option>
                {availableRegions.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset Filters */}
          {(searchQuery || statusFilter !== 'All' || regionFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setRegionFilter('All');
              }}
              className="rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* 4. Error State Banner (If Server Offline or Authorization Failure) */}
      {errorMessage && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900 shadow-xs flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800">Connection Alert</h3>
            <p className="mt-0.5 text-xs text-rose-700 leading-relaxed">{errorMessage}</p>
            <button
              type="button"
              onClick={() => fetchAllReports(true)}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry Request</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Main Content: Loading State vs Empty State vs Data Grid */}
      {isLoading ? (
        /* LOADING STATE */
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white py-20 px-4 text-center shadow-xs">
          <div className="relative mb-4 flex h-14 w-14 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20" />
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Querying National Inspection Registry...</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            Fetching live inspection dossiers and legal metrology parameters from MongoDB server.
          </p>
        </div>
      ) : filteredReports.length === 0 ? (
        /* EMPTY STATE */
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white py-16 px-4 text-center shadow-xs">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 ring-8 ring-slate-50">
            <FileCheck2 className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Inspection Records Found</h3>
          <p className="mt-1 max-w-md text-xs sm:text-sm text-slate-500 leading-relaxed">
            {reports.length === 0
              ? 'The database is currently empty. Run an inspection scan from the field terminal or seed initial records.'
              : 'No reports match your active search or filter criteria. Try clearing or widening your filters.'}
          </p>
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setRegionFilter('All');
              }}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer"
            >
              Reset Filters
            </button>
            <button
              type="button"
              onClick={() => fetchAllReports(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh Registry</span>
            </button>
          </div>
        </div>
      ) : (
        /* 6. LUXURIOUS RESPONSIVE TAILWIND CSS DATA GRID */
        <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              {/* Table Header */}
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="py-3.5 pl-6 pr-3">
                    Officer Name
                  </th>
                  <th scope="col" className="px-3 py-3.5">
                    Region
                  </th>
                  <th scope="col" className="px-3 py-3.5">
                    Scan Date
                  </th>
                  <th scope="col" className="px-3 py-3.5">
                    Missing Fields
                  </th>
                  <th scope="col" className="px-3 py-3.5">
                    Compliance Status
                  </th>
                  <th scope="col" className="py-3.5 pl-3 pr-6 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredReports.map((report) => {
                  const officerName = report.officerName || report.officer?.name || 'Field Officer';
                  const badgeId = report.officerId || report.officer?.badgeId || 'INSP-GJ-2041';
                  const region = report.region || report.officer?.region || 'Gujarat';
                  const scanDate = report.createdAt
                    ? new Date(report.createdAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'N/A';

                  const missingList = Array.isArray(report.missingFields) ? report.missingFields : [];
                  const isCompliant = report.verdict === 'Compliant';

                  return (
                    <tr
                      key={report._id}
                      className="group transition-colors hover:bg-blue-50/40"
                    >
                      {/* 1. Officer Name Column */}
                      <td className="py-4 pl-6 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-xs">
                            {officerName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                              {officerName}
                            </p>
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-600">
                              {badgeId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Region Column */}
                      <td className="px-3 py-4">
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <span>{region}</span>
                        </div>
                      </td>

                      {/* 3. Scan Date Column */}
                      <td className="px-3 py-4 text-slate-600">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{scanDate}</span>
                        </div>
                      </td>

                      {/* 4. Missing Fields Column */}
                      <td className="px-3 py-4">
                        {missingList.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>None (All Verified)</span>
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {missingList.map((field, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-bold text-rose-700"
                              >
                                <XCircle className="h-3 w-3 text-rose-500" />
                                <span>{field}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* 5. Compliance Status Column */}
                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                            isCompliant
                              ? 'bg-emerald-100/80 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100/80 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {isCompliant ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-rose-600" />
                          )}
                          <span>{report.verdict}</span>
                        </span>
                      </td>

                      {/* 6. Actions Column */}
                      <td className="py-4 pl-3 pr-6 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedReport(report)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-600 shadow-xs hover:border-blue-400 hover:bg-blue-50 transition cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer Summary */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-6 py-3.5 text-xs text-slate-500 font-medium">
            <span>
              Showing <strong className="text-slate-900 font-bold">{filteredReports.length}</strong> of{' '}
              <strong className="text-slate-900 font-bold">{reports.length}</strong> total statutory records
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              MongoDB Collection: reports • Live Synced
            </span>
          </div>
        </div>
      )}

      {/* 7. Detailed Inspection Dossier Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-bold font-mono">
                    {selectedReport.docketId || `TRN-${selectedReport._id.slice(-6).toUpperCase()}`}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                      selectedReport.verdict === 'Compliant'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {selectedReport.verdict}
                  </span>
                </div>
                <h3 className="mt-1.5 text-lg font-black text-slate-900">
                  {selectedReport.productName || 'Inspected Package Artwork'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Field Officer</span>
                  <p className="mt-1 font-bold text-slate-800">
                    {selectedReport.officerName || selectedReport.officer?.name || 'Inspector'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">{selectedReport.officerId || selectedReport.officer?.badgeId}</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Jurisdiction</span>
                  <p className="mt-1 font-bold text-slate-800">{selectedReport.region || selectedReport.officer?.region || 'N/A'}</p>
                  <p className="text-[10px] text-slate-500">{selectedReport.location || 'Field Inspection Station'}</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">OCR Confidence</span>
                  <p className="mt-1 font-bold text-blue-600">{selectedReport.ocrConfidence || '98%'}</p>
                  <p className="text-[10px] text-slate-500">Tesseract Engine</p>
                </div>
              </div>

              {/* Missing Fields Breakdown if Failed */}
              {selectedReport.missingFields && selectedReport.missingFields.length > 0 && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 font-bold">
                    <XCircle className="h-4 w-4 text-rose-600" />
                    <span>Statutory Violations (Missing Declarations):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedReport.missingFields.map((field, i) => (
                      <span
                        key={i}
                        className="rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                  {selectedReport.reasonsForFailure && selectedReport.reasonsForFailure.length > 0 && (
                    <ul className="mt-2 list-disc list-inside text-rose-700 text-[11px] space-y-1">
                      {selectedReport.reasonsForFailure.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Extracted Text */}
              {selectedReport.extractedText && (
                <div className="rounded-2xl border border-slate-200 bg-slate-900 p-4 text-slate-100 font-mono text-[11px] space-y-1.5">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    Extracted OCR Packaging Text:
                  </span>
                  <p className="whitespace-pre-wrap leading-relaxed text-slate-300">
                    {selectedReport.extractedText}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
