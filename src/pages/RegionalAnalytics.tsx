import { useMemo } from 'react';
import {
  BarChart3,
  MapPin,
} from 'lucide-react';
import { useTriNetra, type InspectionReport } from '../context/TriNetraContext';
import { INDIAN_STATES as REGIONS } from '../constants/indianStates';

export default function RegionalAnalytics() {
  const { reports } = useTriNetra();

  const allLogs: InspectionReport[] = useMemo(() => {
    try {
      const stored = localStorage.getItem('trinetra_reports');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return reports;
  }, [reports]);

  const regionMetrics = useMemo(() => {
    return REGIONS.map((regionName) => {
      const targetRegionLower = String(regionName || '').toLowerCase().trim();
      const logs = allLogs.filter(
        (r) => String(r?.region || '').toLowerCase().trim() === targetRegionLower
      );
      const total = logs.length;
      const compliant = logs.filter((r) => r.verdict === 'Compliant').length;
      const violations = logs.filter((r) => r.verdict === 'Non-Compliant').length;
      const review = logs.filter((r) => r.verdict === 'Manual Review').length;
      const passRate = total > 0 ? Math.round((compliant / total) * 100) : 100;
      const penalties = violations * 25000;
      return {
        region: regionName,
        total,
        compliant,
        violations,
        review,
        passRate,
        penalties,
      };
    });
  }, [allLogs]);

  return (
    <div className="w-full space-y-6 pb-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
          <BarChart3 className="h-3.5 w-3.5" />
          <span>Regional Intelligence & Metrology Trends</span>
        </div>
        <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight sm:text-3xl">
          Gujarat Regional Analytics Dashboard
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Statewide comparative analysis of statutory weights and packaging audits across all 5 enforcement circles.
        </p>
      </div>

      {/* Grid of Regional Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {regionMetrics.map((rm) => (
          <div
            key={rm.region}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{rm.region} Zone</h3>
                  <span className="text-[10px] text-slate-400 font-medium">District Metrology Grid</span>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                {rm.passRate}% Compliant
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-50 p-2.5">
                <span className="text-xs text-slate-400 block font-semibold">Total Audits</span>
                <span className="text-lg font-black text-slate-900">{rm.total}</span>
              </div>
              <div className="rounded-xl bg-emerald-50 p-2.5">
                <span className="text-xs text-emerald-600 block font-semibold">Compliant</span>
                <span className="text-lg font-black text-emerald-700">{rm.compliant}</span>
              </div>
              <div className="rounded-xl bg-rose-50 p-2.5">
                <span className="text-xs text-rose-600 block font-semibold">Violations</span>
                <span className="text-lg font-black text-rose-700">{rm.violations}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-[11px] font-semibold">
                <span className="text-slate-500">Statutory Compliance Index</span>
                <span className="text-slate-900">{rm.passRate}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
                  style={{ width: `${rm.passRate}%` }}
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Penalties Assessed</span>
              <span className="font-bold text-slate-900">₹{rm.penalties.toLocaleString('en-IN')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
