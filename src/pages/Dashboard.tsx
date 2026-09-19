import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  CircleCheck,
  TriangleAlert,
  MapPin,
  FileSearch,
  ArrowUpRight,
  IndianRupee,
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
  AlertTriangle,
  Globe2,
} from 'lucide-react';
import { useTriNetra, type UserRole, type InspectionReport } from '../context/TriNetraContext';
import { INDIAN_STATES } from '../constants/indianStates';

export default function Dashboard() {
  const navigate = useNavigate();
  const { officer, reports } = useTriNetra();

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

  // Read all inspection logs safely from localStorage with fallback to context
  const allLogs: InspectionReport[] = useMemo(() => {
    try {
      const stored = localStorage.getItem('trinetra_reports');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse logs from localStorage:', e);
    }
    return reports;
  }, [reports]);

  // Filter states for Admin View (Pan-India State Filter)
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedVerdict, setSelectedVerdict] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter states for Officer View
  const [officerCategoryFilter, setOfficerCategoryFilter] = useState<string>('All');

  // Officer-specific reports: filter safely by officer's badgeId or officer's region
  const officerLogs = useMemo(() => {
    if (!officer) return allLogs;
    const officerRegionLower = String(officer.region || '').toLowerCase().trim();
    const officerBadge = String(officer.badgeId || '').toUpperCase().trim();

    const matched = allLogs.filter((r) => {
      const reportOfficerId = String(r.officerId || '').toUpperCase().trim();
      const reportRegionLower = String(r.region || '').toLowerCase().trim();
      return (
        (officerBadge && reportOfficerId === officerBadge) ||
        (officerRegionLower && reportRegionLower === officerRegionLower)
      );
    });
    return matched.length > 0 ? matched : allLogs;
  }, [allLogs, officer]);

  // Admin filtered data table: filter safely by Pan-India State / UT, verdict, and query
  const adminFilteredLogs = useMemo(() => {
    const selectedStateLower = String(selectedState || '').toLowerCase().trim();
    const q = String(searchQuery || '').toLowerCase().trim();

    return allLogs.filter((log) => {
      const logRegionLower = String(log.region || '').toLowerCase().trim();
      const logLocationLower = String(log.location || '').toLowerCase().trim();
      const logVerdict = String(log.verdict || '').trim();

      const matchState =
        selectedState === 'All' ||
        logRegionLower === selectedStateLower ||
        logLocationLower.includes(selectedStateLower);

      const matchVerdict =
        selectedVerdict === 'All' || logVerdict === selectedVerdict;

      const matchSearch =
        !q ||
        String(log.productName || '').toLowerCase().includes(q) ||
        String(log.officerName || '').toLowerCase().includes(q) ||
        String(log.officerId || '').toLowerCase().includes(q) ||
        logRegionLower.includes(q) ||
        logLocationLower.includes(q) ||
        String(log.id || '').toLowerCase().includes(q);

      return matchState && matchVerdict && matchSearch;
    });
  }, [allLogs, selectedState, selectedVerdict, searchQuery]);

  // Metrics calculation
  const currentLogs = isAdmin ? adminFilteredLogs : officerLogs;
  const totalCount = currentLogs.length;
  const compliantCount = currentLogs.filter((r) => r.verdict === 'Compliant').length;
  const violationCount = currentLogs.filter((r) => r.verdict === 'Non-Compliant').length;
  const manualReviewCount = currentLogs.filter((r) => r.verdict === 'Manual Review').length;
  const passRate = totalCount > 0 ? ((compliantCount / totalCount) * 100).toFixed(1) : '100';

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

          <p className="mt-1 text-sm text-gray-500 flex flex-wrap items-center gap-2">
            <span>Welcome,</span>
            <strong className="text-gray-900 font-bold">
              {officer?.name || (isAdmin ? 'Director Amit Trivedi' : 'Inspector Rajesh Varma')}
            </strong>
            <span
              className={`rounded px-2 py-0.5 text-xs font-mono font-bold ${
                isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
              }`}
            >
              {officer?.badgeId || (isAdmin ? 'ADMIN-HQ-01' : 'INSP-GJ-2041')}
            </span>
            <span>• Role:</span>
            <span className={`font-semibold ${isAdmin ? 'text-purple-700' : 'text-blue-700'}`}>
              {activeRole}
            </span>
            <span>• Jurisdiction:</span>
            <span className="font-semibold text-gray-700 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {officer?.region || (isAdmin ? 'National HQ (Delhi)' : 'Gujarat')}
            </span>
          </p>
        </div>

        {/* Action Button: Field Officer gets "Start Inspection", Admin gets "Review Officer Logs" */}
        <div className="flex items-center gap-3">
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
      {/* 2. DYNAMIC METRIC CARDS                                                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <div className="rounded-3xl border border-slate-200/90 bg-white/90 backdrop-blur-md p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isAdmin
                ? selectedState === 'All'
                  ? 'Pan-India Inspections'
                  : `${selectedState} Inspections`
                : 'My State Inspections'}
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <FileSearch className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-slate-900">{totalCount}</span>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {isAdmin
                ? selectedState === 'All'
                  ? 'Across All 28 States & 8 UTs'
                  : `Active in ${selectedState}`
                : `Assigned in ${officer?.region || 'Gujarat'}`}
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-3xl border border-slate-200/90 bg-white/90 backdrop-blur-md p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Compliant Verified
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CircleCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-emerald-600">{compliantCount}</span>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {passRate}% statutory compliance rate
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-3xl border border-slate-200/90 bg-white/90 backdrop-blur-md p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Violations & Seizures
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-rose-600">{violationCount}</span>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Section 36 notices issued
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-3xl border border-slate-200/90 bg-white/90 backdrop-blur-md p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isAdmin ? 'Total Penalties Levied' : 'Pending Manual Review'}
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
              {isAdmin ? <IndianRupee className="h-5 w-5" /> : <TriangleAlert className="h-5 w-5" />}
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-slate-900">
              {isAdmin ? `₹${(violationCount * 25000).toLocaleString('en-IN')}` : manualReviewCount}
            </span>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {isAdmin ? 'Section 48 compounding ledger' : 'Secondary optical check'}
            </p>
          </div>
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
                    <th className="py-3 px-3">Officer Name</th>
                    <th className="py-3 px-3">Badge ID</th>
                    <th className="py-3 px-3">State / UT</th>
                    <th className="py-3 px-3">Package / Commodity</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Inspection Verdict</th>
                    <th className="py-3 px-3 text-right">Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {adminFilteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        <MapPin className="h-6 w-6 mx-auto mb-2 text-slate-300" />
                        <span className="block font-semibold text-slate-600">
                          No inspection records found for {selectedState === 'All' ? 'selected filters' : selectedState}.
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Field officers operating in this State/UT have not logged packaging audits yet.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    adminFilteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Officer Name */}
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-slate-900 block">{log.officerName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">#{log.id}</span>
                        </td>

                        {/* Badge ID */}
                        <td className="py-3.5 px-3">
                          <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-700 ring-1 ring-blue-600/20">
                            {log.officerId}
                          </span>
                        </td>

                        {/* State / UT */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-800">{log.region}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[150px]" title={log.location}>
                            {log.location}
                          </span>
                        </td>

                        {/* Package / Commodity */}
                        <td className="py-3.5 px-3 max-w-[200px]">
                          <span className="font-semibold text-slate-900 block truncate" title={log.productName}>
                            {log.productName}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate block">{log.brand}</span>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className="text-slate-600 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {log.inspectionDate}
                          </span>
                        </td>

                        {/* Verdict */}
                        <td className="py-3.5 px-3">
                          {log.verdict === 'Compliant' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                              <CheckCircle2 className="h-3 w-3" />
                              Compliant
                            </span>
                          )}
                          {log.verdict === 'Non-Compliant' && (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20">
                                <ShieldAlert className="h-3 w-3" />
                                Non-Compliant
                              </span>
                              {log.violations?.[0] && (
                                <span className="block text-[10px] text-rose-600 font-medium truncate max-w-[180px]">
                                  {log.violations[0]}
                                </span>
                              )}
                            </div>
                          )}
                          {log.verdict === 'Manual Review' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
                              <AlertTriangle className="h-3 w-3" />
                              Manual Review
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => navigate('/reports')}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-blue-600"
                          >
                            <span>Dossier</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
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
          {/* Action Quick Launchers Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Launch Inspection */}
            <div
              onClick={() => navigate('/scanner')}
              className="group cursor-pointer rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                  <ScanLine className="h-6 w-6 text-white" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-blue-200 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </div>
              <h3 className="mt-5 text-lg font-black tracking-tight">Start New Package Inspection</h3>
              <p className="mt-1 text-xs text-blue-100">
                Run automated OCR scanning against Legal Metrology Rules, verify mandatory MRP, Net Volume & FSSAI declarations.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white underline">
                <span>Launch Camera / OCR</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Card 2: Generate Compliance PDFs */}
            <div
              onClick={() => navigate('/reports')}
              className="group cursor-pointer rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-blue-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <FileText className="h-6 w-6" />
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
              </div>
              <h3 className="mt-5 text-lg font-black text-slate-900 tracking-tight">Generate Compliance PDFs</h3>
              <p className="mt-1 text-xs text-slate-500">
                Compile statutory violation notices under Section 36 and export court-admissible audit dossiers with timestamps.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600">
                <span>Open Reports & PDF Generator</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Card 3: Jurisdictional Status */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                  <MapPin className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  Shift Active
                </span>
              </div>
              <h3 className="mt-5 text-lg font-black text-slate-900 tracking-tight">
                {officer?.region || 'Gujarat'} Regulatory Jurisdiction
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Assigned Officer: <strong className="text-slate-800">{officer?.name || 'Inspector Rajesh Varma'}</strong> ({officer?.badgeId || 'INSP-GJ-2041'}). Local logs automatically cached to client storage.
              </p>
              <div className="mt-4 text-[11px] font-mono text-slate-500">
                National Enforcement Portal: Connected
              </div>
            </div>
          </div>

          {/* Officer's Local Inspection History Table */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  My State Inspection History ({officer?.region || 'Gujarat'})
                </h2>
                <p className="text-xs text-slate-500">
                  Inspections recorded by your badge in the current regulatory cycle
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
                  <option value="Household Commodities">Household Commodities</option>
                </select>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-3">Product Name</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Location</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Verdict</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {officerFilteredCategoryLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-900 block">{log.productName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">#{log.id}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {log.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 max-w-[200px] truncate">
                        <div className="flex items-center gap-1 text-slate-600 truncate">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{log.location}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-600">
                        {log.inspectionDate}
                      </td>
                      <td className="py-3.5 px-3">
                        {log.verdict === 'Compliant' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                            <CheckCircle2 className="h-3 w-3" />
                            Compliant
                          </span>
                        )}
                        {log.verdict === 'Non-Compliant' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-600/20">
                            <ShieldAlert className="h-3 w-3" />
                            Non-Compliant
                          </span>
                        )}
                        {log.verdict === 'Manual Review' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-600/20">
                            <AlertTriangle className="h-3 w-3" />
                            Manual Review
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => navigate('/reports')}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-blue-600"
                        >
                          <span>PDF</span>
                          <Download className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
              <span>Showing {officerFilteredCategoryLogs.length} reports filed by your badge.</span>
              <button
                type="button"
                onClick={() => navigate('/reports')}
                className="font-semibold text-blue-600 hover:underline"
              >
                View full historical archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
