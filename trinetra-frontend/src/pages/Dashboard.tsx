import { useState, useMemo, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldAlert,
  CircleCheck,
  TriangleAlert,
  MapPin,
  FileSearch,
  ArrowUpRight,
  Layers,
  ChevronRight,
  Clock,
  Download,
  ScanLine,
  FileText,
  Building2,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Globe2,
  RefreshCw,
  PlusCircle,
  Scale,
  Store,
  FileSpreadsheet,
  Check,
  X,
} from 'lucide-react';
import { useTriNetra, type UserRole, type InspectionReport } from '../context/TriNetraContext';
import { INDIAN_STATES } from '../constants/indianStates';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { officer, reports, isLoadingReports, fetchReports, submitReport } = useTriNetra();

  // Access Denied banner state from unauthorized redirection
  const [accessDeniedNotice, setAccessDeniedNotice] = useState<string | null>(() => {
    const state = location.state as { accessDenied?: boolean; message?: string } | null;
    return state?.accessDenied
      ? state.message || 'Access Denied: The requested operational resource is restricted to Field Officers.'
      : null;
  });

  // Safely resolve current role
  const activeRole: UserRole = (() => {
    if (officer?.role) return officer.role;
    try {
      const session = localStorage.getItem('activeSession');
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed?.role) return parsed.role as UserRole;
      }
    } catch {}
    return 'Field Officer';
  })();

  const isAdmin = activeRole === 'Admin';

  // Live reports directly from MongoDB
  const allLogs: InspectionReport[] = reports;

  // New Inspection Form state for Field Officer
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [equipmentChecked, setEquipmentChecked] = useState('');
  const [status, setStatus] = useState<'Pass' | 'Fail'>('Pass');
  const [remarks, setRemarks] = useState('');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Handle Form Submission to POST /api/reports
  const handleCreateReport = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!shopName.trim()) {
      setFormError('Please enter the Shop / Establishment Name.');
      return;
    }

    if (!equipmentChecked.trim()) {
      setFormError('Please specify the Equipment / Instrument Checked (e.g. Electronic Weighing Scale).');
      return;
    }

    setIsSubmittingForm(true);

    try {
      await submitReport({
        shopName: shopName.trim(),
        address: address.trim(),
        equipmentChecked: equipmentChecked.trim(),
        status,
        remarks: remarks.trim(),
        region: officer?.region || 'Gujarat',
      });

      setFormSuccess(`Inspection report for "${shopName}" submitted and saved to MongoDB!`);
      // Reset form fields
      setShopName('');
      setAddress('');
      setEquipmentChecked('');
      setStatus('Pass');
      setRemarks('');
      // Re-fetch to ensure sync
      fetchReports();
    } catch (err: any) {
      console.error('Failed to submit report:', err);
      setFormError(err?.message || 'Failed to submit report to database');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Filter states for Admin View (Pan-India State Filter)
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedVerdict, setSelectedVerdict] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Synchronize with backend API on mount and filter changes
  useEffect(() => {
    fetchReports({
      region: isAdmin && selectedState !== 'All' ? selectedState : undefined,
      verdict: selectedVerdict !== 'All' ? selectedVerdict : undefined,
      search: searchQuery || undefined,
    });
  }, [isAdmin, selectedState, selectedVerdict, searchQuery, fetchReports]);

  // Filter states for Officer View
  const [officerCategoryFilter, setOfficerCategoryFilter] = useState<string>('All');

  // Officer-specific reports: filter safely by officer's badgeId
  const officerLogs = useMemo(() => {
    if (!officer) return allLogs;
    const officerBadge = String(officer.badgeId || '').toUpperCase().trim();

    return allLogs.filter((r) => {
      const reportOfficerId = String(r.officerId || '').toUpperCase().trim();
      return !officerBadge || reportOfficerId === officerBadge;
    });
  }, [allLogs, officer]);

  // Admin filtered data table: filter safely by Pan-India State / UT, verdict, and query
  const adminFilteredLogs = useMemo(() => {
    const selectedStateLower = String(selectedState || '').toLowerCase().trim();
    const q = String(searchQuery || '').toLowerCase().trim();

    return allLogs.filter((log) => {
      const logRegionLower = String(log.region || '').toLowerCase().trim();
      const logLocationLower = String(log.location || '').toLowerCase().trim();
      const logVerdict = String(log.verdict || '').trim();
      const logStatus = String(log.status || '').trim();

      const matchState =
        selectedState === 'All' ||
        logRegionLower === selectedStateLower ||
        logLocationLower.includes(selectedStateLower);

      const matchVerdict =
        selectedVerdict === 'All' ||
        logVerdict === selectedVerdict ||
        (selectedVerdict === 'Pass' && (logStatus === 'Pass' || logVerdict === 'Compliant')) ||
        (selectedVerdict === 'Fail' && (logStatus === 'Fail' || logVerdict === 'Non-Compliant'));

      const matchSearch =
        !q ||
        String(log.shopName || '').toLowerCase().includes(q) ||
        String(log.address || '').toLowerCase().includes(q) ||
        String(log.equipmentChecked || '').toLowerCase().includes(q) ||
        String(log.productName || '').toLowerCase().includes(q) ||
        String(log.officerName || '').toLowerCase().includes(q) ||
        String(log.officerId || '').toLowerCase().includes(q) ||
        logRegionLower.includes(q) ||
        logLocationLower.includes(q) ||
        String(log.id || '').toLowerCase().includes(q);

      return matchState && matchVerdict && matchSearch;
    });
  }, [allLogs, selectedState, selectedVerdict, searchQuery]);

  // Exact Summary Cards for Admin
  const adminTotalReports = allLogs.length;
  const adminTotalPassed = allLogs.filter(
    (r) => r.status === 'Pass' || r.verdict === 'Compliant'
  ).length;
  const adminTotalFailed = allLogs.filter(
    (r) => r.status === 'Fail' || r.verdict === 'Non-Compliant'
  ).length;

  // Officer metrics
  const officerTotal = officerLogs.length;
  const officerPassed = officerLogs.filter(
    (r) => r.status === 'Pass' || r.verdict === 'Compliant'
  ).length;
  const officerFailed = officerLogs.filter(
    (r) => r.status === 'Fail' || r.verdict === 'Non-Compliant'
  ).length;

  // Extract unique active states present in the inspection ledger
  const activeStatesInLogs = useMemo(() => {
    const states = new Set<string>();
    allLogs.forEach((l) => {
      if (l.region) states.add(l.region);
    });
    return Array.from(states).sort();
  }, [allLogs]);

  // Officer filtered category logs
  const officerFilteredCategoryLogs = useMemo(() => {
    if (officerCategoryFilter === 'All') return officerLogs;
    return officerLogs.filter((l) => l.category === officerCategoryFilter);
  }, [officerLogs, officerCategoryFilter]);

  return (
    <div className="w-full space-y-8 pb-8">
      {/* Access Denied Warning Banner */}
      {accessDeniedNotice && (
        <div className="flex items-center justify-between rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-xs font-bold text-amber-900 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-amber-200 rounded-xl text-amber-800 shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="font-extrabold text-amber-950">Security Access Restriction</p>
              <p className="font-medium text-amber-800 mt-0.5">{accessDeniedNotice}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAccessDeniedNotice(null)}
            className="p-1.5 rounded-xl text-amber-700 hover:bg-amber-100 hover:text-amber-900 transition cursor-pointer"
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP HEADER - ROLE SPECIFIC GREETING                                    */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-700/10">
            <Globe2 className="h-3.5 w-3.5" />
            <span>
              {isAdmin
                ? 'National Legal Metrology Command Center • Govt of India'
                : 'State Metrology Operational Docket'}
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
            {isAdmin ? 'Pan-India Administrative Command Center' : 'Field Inspection & Compliance Workspace'}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-slate-600">
            <span className="font-medium text-slate-700">
              Welcome, <strong className="font-bold text-slate-900 font-mono text-base">{officer?.badgeId || localStorage.getItem('badgeId') || (isAdmin ? 'ADMIN-HQ-01' : 'INSP-GJ-2041')}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-xs ${
                isAdmin
                  ? 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-400/20'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-400/20'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isAdmin ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                }`}
              />
              Role: {activeRole}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <strong className="text-slate-800">{officer?.name || (isAdmin ? 'Director Amit Trivedi' : 'Inspector Rajesh Varma')}</strong>
              <span>({officer?.region || (isAdmin ? 'National HQ (Delhi)' : 'Gujarat')})</span>
            </span>
          </div>
        </div>

        {/* Action Buttons: Live Database Sync, Field Officer "Start Inspection", Admin "Review Officer Logs" */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() =>
              fetchReports({
                region: isAdmin && selectedState !== 'All' ? selectedState : undefined,
                verdict: selectedVerdict !== 'All' ? selectedVerdict : undefined,
                search: searchQuery || undefined,
              })
            }
            disabled={isLoadingReports}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-sm hover:bg-slate-50 transition active:scale-95 disabled:opacity-60 cursor-pointer"
            title="Sync latest live inspections from MongoDB"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                isLoadingReports ? 'animate-spin text-blue-600' : 'text-slate-500'
              }`}
            />
            <span>{isLoadingReports ? 'Syncing...' : 'Live Sync'}</span>
          </button>

          {isAdmin ? (
            <button
              type="button"
              onClick={() => navigate('/officer-logs')}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-95"
            >
              <Users className="h-4 w-4" />
              <span>Review National Officer Logs</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/scanner')}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-95"
            >
              <ScanLine className="h-4 w-4" />
              <span>Start Packaging Inspection</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUMMARY METRIC CARDS (REAL-TIME FROM MONGODB)                          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Card 1: Total Reports */}
        <div className="rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isAdmin ? 'Total Reports (National)' : 'My Total Inspections'}
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <FileSearch className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-black text-slate-900">
              {isAdmin ? adminTotalReports : officerTotal}
            </span>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
              Live in MongoDB
            </span>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            {isAdmin
              ? 'Aggregated across all field enforcement officers'
              : `Logged under badge ${officer?.badgeId || 'active profile'}`}
          </p>
        </div>

        {/* Card 2: Total Passed */}
        <div className="rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Passed (Compliant)
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CircleCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-black text-emerald-600">
              {isAdmin ? adminTotalPassed : officerPassed}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              {((isAdmin ? adminTotalReports : officerTotal) > 0
                ? (((isAdmin ? adminTotalPassed : officerPassed) / (isAdmin ? adminTotalReports : officerTotal)) * 100).toFixed(0)
                : 100)}% Pass
            </span>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            Equipment passed Legal Metrology tolerance verification
          </p>
        </div>

        {/* Card 3: Total Failed */}
        <div className="rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Failed (Non-Compliant)
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-black text-rose-600">
              {isAdmin ? adminTotalFailed : officerFailed}
            </span>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full">
              Action Required
            </span>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            Notice under Section 36 / Stamping tolerances breached
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CONDITIONAL BODY: ADMIN VIEW vs FIELD OFFICER VIEW                    */}
      {/* ========================================================================= */}
      {isAdmin ? (
        /* ========================================================================= */
        /* ADMIN COMMAND CENTER VIEW                                                 */
        /* ========================================================================= */
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Quick Active States Pills Bar */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3.5">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span>Pan-India Jurisdiction Quick Select</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Select an active State or Union Territory to inspect localized officer filings
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                {activeStatesInLogs.length} Active Reporting Regions
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedState('All')}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                  selectedState === 'All'
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All India ({allLogs.length})
              </button>

              {activeStatesInLogs.map((st) => {
                const targetStateLower = String(st || '').toLowerCase().trim();
                const count = allLogs.filter(
                  (l) => String(l.region || '').toLowerCase().trim() === targetStateLower
                ).length;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedState(st)}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                      selectedState === st
                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span>{st}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                        selectedState === st ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Master Admin Inspection Logs Data Table with Filter by State */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Header & Filter Controls */}
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-indigo-600" />
                    <span>Pan-India Packaging Inspection Master Ledger</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Comprehensive ledger of all Field Officer audits, automated OCR scores, and statutory legal verdicts across India
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/reports')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export National Dossiers</span>
                  </button>
                </div>
              </div>

              {/* Filtering Toolbar */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
                {/* Search Bar */}
                <div className="sm:col-span-5 relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Officer Name, Badge ID, Product, City..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition"
                  />
                </div>

                {/* 2. FILTER BY STATE DROPDOWN (Complete 28 States & 8 UTs) */}
                <div className="sm:col-span-4 relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <select
                    id="admin-filter-state"
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-9 pr-3 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition"
                  >
                    <option value="All">Filter by State: All 28 States & 8 UTs</option>
                    {INDIAN_STATES.map((stateName) => (
                      <option key={stateName} value={stateName}>
                        {stateName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Verdict Filter */}
                <div className="sm:col-span-3 relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Filter className="h-4 w-4" />
                  </div>
                  <select
                    value={selectedVerdict}
                    onChange={(e) => setSelectedVerdict(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-9 pr-3 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition"
                  >
                    <option value="All">All Verdicts</option>
                    <option value="Compliant">Compliant</option>
                    <option value="Non-Compliant">Non-Compliant</option>
                    <option value="Manual Review">Manual Review</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Active Filter Pill Badge (when a state is selected) */}
            {selectedState !== 'All' && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50 p-2.5 text-xs text-blue-800">
                <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
                <span>
                  Filtering active state: <strong>{selectedState}</strong> ({adminFilteredLogs.length} matching inspection reports found).
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedState('All')}
                  className="ml-auto text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                >
                  Reset to All States
                </button>
              </div>
            )}

            {/* Data Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-3">Officer Name & Badge</th>
                    <th className="py-3 px-3">Shop / Establishment</th>
                    <th className="py-3 px-3">State / Location</th>
                    <th className="py-3 px-3">Equipment Checked</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {isLoadingReports ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <RefreshCw className="h-6 w-6 mx-auto mb-2 text-blue-600 animate-spin" />
                        <span className="block font-semibold text-slate-700 text-xs">
                          Querying live inspection ledger from MongoDB...
                        </span>
                      </td>
                    </tr>
                  ) : adminFilteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        <MapPin className="h-6 w-6 mx-auto mb-2 text-slate-300" />
                        <span className="block font-semibold text-slate-600">
                          No inspection records found for {selectedState === 'All' ? 'selected filters' : selectedState}.
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Field officers operating in this jurisdiction have not logged inspections yet.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    adminFilteredLogs.map((log, idx) => {
                      const isPass = log.status === 'Pass' || log.verdict === 'Compliant';
                      return (
                        <tr key={log.id || (log as any)._id || `admin-log-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                          {/* Officer Name & Badge */}
                          <td className="py-3.5 px-3">
                            <span className="font-bold text-slate-900 block">{log.officerName}</span>
                            <span className="inline-block mt-0.5 rounded bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-700 ring-1 ring-blue-600/20">
                              {log.officerId}
                            </span>
                          </td>

                          {/* Shop / Establishment */}
                          <td className="py-3.5 px-3 max-w-[200px]">
                            <span className="font-bold text-slate-900 block truncate" title={log.shopName || log.productName}>
                              {log.shopName || log.brand || log.productName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              #{log.docketId || log.id}
                            </span>
                          </td>

                          {/* State / Location */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="font-semibold text-slate-800">{log.region}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[150px]" title={log.address || log.location}>
                              {log.address || log.location}
                            </span>
                          </td>

                          {/* Equipment Checked */}
                          <td className="py-3.5 px-3 max-w-[180px]">
                            <span className="font-medium text-slate-800 block truncate" title={log.equipmentChecked || log.productName}>
                              {log.equipmentChecked || log.productName}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span className="text-slate-600 flex items-center gap-1 text-[11px]">
                              <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                              {log.inspectionDate}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3">
                            {isPass ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                <CheckCircle2 className="h-3 w-3" />
                                Pass
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20">
                                <ShieldAlert className="h-3 w-3" />
                                Fail
                              </span>
                            )}
                          </td>

                          {/* Remarks */}
                          <td className="py-3.5 px-3 text-right max-w-[180px]">
                            <span className="text-[11px] text-slate-500 truncate block text-right" title={log.remarks || log.findings || 'Verified'}>
                              {log.remarks || log.findings || (isPass ? 'Compliant' : 'Non-Compliant')}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:flex-row">
              <span>
                Showing {adminFilteredLogs.length} of {allLogs.length} records synchronized from Pan-India field terminals.
              </span>
              <span className="font-semibold text-purple-700">Administrator National Command Grid Active</span>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* FIELD OFFICER ACTION-FOCUSED VIEW                                         */
        /* ========================================================================= */
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* 1. New Inspection Report Form */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-700 mb-2">
                  <Scale className="h-3.5 w-3.5" />
                  <span>On-Site Statutory Verification</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  New Field Inspection Report
                </h2>
                <p className="text-xs text-slate-500">
                  Submit weights & measures inspection data directly to MongoDB with statutory status
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-mono text-slate-400 block">
                  Jurisdiction: <strong className="text-slate-700">{officer?.region || 'Gujarat'} Circle</strong>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Officer ID: <strong className="text-slate-700">{officer?.badgeId || 'INSP-GJ-2041'}</strong>
                </span>
              </div>
            </div>

            {/* Form Success Banner */}
            {formSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="font-semibold">{formSuccess}</span>
              </div>
            )}

            {/* Form Error Banner */}
            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 animate-in fade-in">
                <TriangleAlert className="h-4 w-4 shrink-0 text-rose-600" />
                <span className="font-semibold">{formError}</span>
              </div>
            )}

            {/* The Real Submission Form */}
            <form onSubmit={handleCreateReport} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Shop Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Shop / Establishment Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Store className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={shopName}
                      onChange={(e) => {
                        setShopName(e.target.value);
                        if (formError) setFormError('');
                      }}
                      placeholder="e.g., Apex Provision Store, C.G. Road"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-3.5 text-xs font-semibold text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition"
                    />
                  </div>
                </div>

                {/* Equipment Checked */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Equipment Checked <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Scale className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={equipmentChecked}
                      onChange={(e) => {
                        setEquipmentChecked(e.target.value);
                        if (formError) setFormError('');
                      }}
                      placeholder="e.g., Electronic Weighing Scale (Model ES-200)"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-3.5 text-xs font-semibold text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Shop Address / Location
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g., Shop #14, Ground Floor, Sector 17, Market Square"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-3.5 text-xs font-semibold text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition"
                    />
                  </div>
                </div>

                {/* Status Selection (Pass / Fail) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Inspection Status <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus('Pass')}
                      className={`flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
                        status === 'Pass'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Check className="h-4 w-4" />
                      <span>Pass</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatus('Fail')}
                      className={`flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
                        status === 'Fail'
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20 ring-2 ring-rose-500'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <X className="h-4 w-4" />
                      <span>Fail</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Inspection Remarks / Observations
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g., Stamping seal intact. Calibration verified with standard 5kg class F weight. Tolerances within permissible limits."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-2.5 px-3.5 text-xs font-semibold text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition"
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-700 hover:shadow-xl active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>{isSubmittingForm ? 'Submitting to MongoDB...' : 'Save & Submit Inspection Report'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* 2. Quick Launchers & Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: Launch Camera OCR */}
            <div
              onClick={() => navigate('/scanner')}
              className="group cursor-pointer rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-500/20 transition-all duration-300 hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                  <ScanLine className="h-6 w-6 text-white" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-blue-200 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </div>
              <h3 className="mt-5 text-lg font-black tracking-tight">Camera OCR Packaging Inspection</h3>
              <p className="mt-1 text-xs text-blue-100">
                Audit pre-packaged commodities with AI OCR scanner checking MRP, Net Volume & FSSAI declarations under 2011 Rules.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white underline">
                <span>Open Optical Scanner</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Card 2: Legal Dossier Generator */}
            <div
              onClick={() => navigate('/reports')}
              className="group cursor-pointer rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:scale-[1.01] hover:border-blue-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
              </div>
              <h3 className="mt-5 text-lg font-black text-slate-900 tracking-tight">Statutory Legal Dossiers & Export</h3>
              <p className="mt-1 text-xs text-slate-500">
                Review compiled violation records under Section 36 and export court-admissible audit reports with digital timestamps.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600">
                <span>View Full Archive & Dossiers</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>

          {/* 3. Officer's Personal Inspection History Data Table */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  <span>My Inspection Ledger (Badge #{officer?.badgeId || 'INSP-GJ-2041'})</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Verified inspection records filed by your officer badge in MongoDB
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Category:</span>
                <select
                  value={officerCategoryFilter}
                  onChange={(e) => setOfficerCategoryFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="All">All Categories</option>
                  <option value="Food & Beverages">Food & Beverages</option>
                  <option value="Personal Care & Cosmetics">Personal Care & Cosmetics</option>
                  <option value="Commercial Weights & Measures">Commercial Weights & Measures</option>
                  <option value="Household Commodities">Household Commodities</option>
                </select>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-3">Shop / Establishment</th>
                    <th className="py-3 px-3">Address</th>
                    <th className="py-3 px-3">Equipment Checked</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {isLoadingReports ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <RefreshCw className="h-6 w-6 mx-auto mb-2 text-blue-600 animate-spin" />
                        <span className="block font-semibold text-slate-700 text-xs">
                          Loading your inspection records from MongoDB...
                        </span>
                      </td>
                    </tr>
                  ) : officerFilteredCategoryLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Scale className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                        <span className="block font-semibold text-slate-600">
                          No inspection reports submitted yet under your badge.
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Fill out the form above to record your first on-site inspection.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    officerFilteredCategoryLogs.map((log, idx) => {
                      const isPass = log.status === 'Pass' || log.verdict === 'Compliant';
                      return (
                        <tr key={log.id || (log as any)._id || `officer-log-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                          {/* Shop Name */}
                          <td className="py-3.5 px-3 max-w-[200px]">
                            <span className="font-bold text-slate-900 block truncate" title={log.shopName || log.productName}>
                              {log.shopName || log.brand || log.productName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">#{log.docketId || log.id}</span>
                          </td>

                          {/* Address */}
                          <td className="py-3.5 px-3 max-w-[220px]">
                            <div className="flex items-center gap-1 text-slate-600 truncate" title={log.address || log.location}>
                              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                              <span className="truncate">{log.address || log.location}</span>
                            </div>
                          </td>

                          {/* Equipment Checked */}
                          <td className="py-3.5 px-3 max-w-[180px]">
                            <span className="font-medium text-slate-800 block truncate" title={log.equipmentChecked || log.productName}>
                              {log.equipmentChecked || log.productName}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 text-[11px]">
                            {log.inspectionDate}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3">
                            {isPass ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                                <CheckCircle2 className="h-3 w-3" />
                                Pass
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-600/20">
                                <ShieldAlert className="h-3 w-3" />
                                Fail
                              </span>
                            )}
                          </td>

                          {/* Remarks */}
                          <td className="py-3.5 px-3 text-right max-w-[200px]">
                            <span className="text-[11px] text-slate-500 truncate block text-right" title={log.remarks || log.findings || 'Compliant'}>
                              {log.remarks || log.findings || (isPass ? 'Compliant' : 'Non-Compliant')}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
              <span>Showing {officerLogs.length} verified inspection reports recorded by your badge in MongoDB.</span>
              <button
                type="button"
                onClick={() => fetchReports()}
                className="font-semibold text-emerald-700 hover:underline"
              >
                Refresh live ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
