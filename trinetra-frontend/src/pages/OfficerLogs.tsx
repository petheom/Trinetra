import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Search,
  MapPin,
  Clock,
  CircleCheck,
  ShieldAlert,
  TriangleAlert,
  Download,
  Filter,
  Users,
} from 'lucide-react';
import { useTriNetra, type InspectionReport } from '../context/TriNetraContext';
import { INDIAN_STATES as REGIONS } from '../constants/indianStates';

export default function OfficerLogs() {
  const navigate = useNavigate();
  const { reports } = useTriNetra();

  // Read all logs from localStorage with fallback
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
      console.warn('Error reading logs in OfficerLogs:', e);
    }
    return reports;
  }, [reports]);

  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedVerdict, setSelectedVerdict] = useState('All');

  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      const logRegionLower = String(log?.region || '').toLowerCase().trim();
      const selectedRegionLower = String(selectedRegion || '').toLowerCase().trim();
      const matchRegion =
        selectedRegion === 'All' || logRegionLower === selectedRegionLower;
      const matchVerdict =
        selectedVerdict === 'All' || log.verdict === selectedVerdict;
      const q = String(search || '').toLowerCase().trim();
      const matchSearch =
        !q ||
        String(log?.officerName || '').toLowerCase().includes(q) ||
        String(log?.officerId || '').toLowerCase().includes(q) ||
        String(log?.productName || '').toLowerCase().includes(q) ||
        logRegionLower.includes(q);
      return matchRegion && matchVerdict && matchSearch;
    });
  }, [allLogs, search, selectedRegion, selectedVerdict]);

  return (
    <div className="w-full space-y-6 pb-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-600/20">
            <Users className="h-3.5 w-3.5" />
            <span>Admin Governance Docket</span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight sm:text-3xl">
            Officer Audit & Inspection Logs
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Review detailed compliance verdicts filed by field officers across Gujarat jurisdictions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/reports')}
          className="inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-purple-700 transition"
        >
          <Download className="h-4 w-4" />
          <span>Export All Officer Records</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Officer Name, Badge ID, or Product..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="sm:col-span-3 relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <MapPin className="h-4 w-4" />
            </div>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-2.5 pl-9 pr-3 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="All">All 28 States & 8 UTs</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3 relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Filter className="h-4 w-4" />
            </div>
            <select
              value={selectedVerdict}
              onChange={(e) => setSelectedVerdict(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-2.5 pl-9 pr-3 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="All">All Verdicts</option>
              <option value="Compliant">Compliant</option>
              <option value="Non-Compliant">Non-Compliant</option>
              <option value="Manual Review">Manual Review</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-purple-600" />
            <span className="font-bold text-slate-900 text-sm">Synchronized Officer Ledger</span>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {filteredLogs.length} records found
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3">Officer Name</th>
                <th className="py-3 px-3">Badge ID</th>
                <th className="py-3 px-3">Region</th>
                <th className="py-3 px-3">Package / Brand</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Verdict</th>
                <th className="py-3 px-3">Findings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900">{log.officerName}</td>
                  <td className="py-3 px-3">
                    <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-700">
                      {log.officerId}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{log.region}</td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-900 block">{log.productName}</span>
                    <span className="text-[10px] text-slate-400">{log.brand}</span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{log.inspectionDate}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    {log.verdict === 'Compliant' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-600/20">
                        <CircleCheck className="h-3 w-3" />
                        Compliant
                      </span>
                    )}
                    {log.verdict === 'Non-Compliant' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 ring-1 ring-rose-600/20">
                        <ShieldAlert className="h-3 w-3" />
                        Non-Compliant
                      </span>
                    )}
                    {log.verdict === 'Manual Review' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 ring-1 ring-amber-600/20">
                        <TriangleAlert className="h-3 w-3" />
                        Manual Review
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-600 text-[11px] max-w-[240px] truncate" title={log.findings}>
                    {log.findings}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
