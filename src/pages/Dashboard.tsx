import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  CircleCheck,
  TriangleAlert,
  TrendingUp,
  MapPin,
  FileSearch,
  ArrowUpRight,
  Sparkles,
  IndianRupee,
  Layers,
  ChevronRight,
  Clock,
  Download,
} from 'lucide-react';
import { useTriNetra } from '../context/TriNetraContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { officer, reports } = useTriNetra();
  const [filterCategory, setFilterCategory] = useState<string>('All');

  // Dynamic Metrics derived from active state
  const totalCount = reports.length;
  const compliantCount = reports.filter((r) => r.verdict === 'Compliant').length;
  const violationCount = reports.filter((r) => r.verdict === 'Non-Compliant').length;
  const passRate = totalCount > 0 ? ((compliantCount / totalCount) * 100).toFixed(1) : '100';

  const metrics = [
    {
      label: 'Total Inspections Today',
      value: String(totalCount),
      change: '+14% active cycle',
      isPositive: true,
      icon: FileSearch,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Compliant Packages',
      value: String(compliantCount),
      change: `${passRate}% statutory pass rate`,
      isPositive: true,
      icon: CircleCheck,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Violations / Non-Compliant',
      value: String(violationCount),
      change: `${violationCount} notices under Section 36`,
      isPositive: false,
      icon: ShieldAlert,
      iconColor: 'text-rose-600',
      bgColor: 'bg-rose-50',
    },
    {
      label: 'Compounding Fees Collected',
      value: `₹${(violationCount * 25000).toLocaleString('en-IN')}`,
      change: 'Section 48 settlements',
      isPositive: true,
      icon: IndianRupee,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  // Category Violation Distribution
  const categoryStats = [
    { name: 'Food & Beverages', count: 12, violations: 4, percentage: 42, color: 'bg-blue-500' },
    { name: 'Personal Care & Cosmetics', count: 8, violations: 2, percentage: 28, color: 'bg-indigo-500' },
    { name: 'Household Commodities', count: 5, violations: 1, percentage: 18, color: 'bg-amber-500' },
    { name: 'General Packaged Goods', count: 3, violations: 0, percentage: 12, color: 'bg-emerald-500' },
  ];

  const filteredLogs =
    filterCategory === 'All'
      ? reports
      : reports.filter((log) => log.category === filterCategory);

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-6">
      {/* 1. Top Header with Dynamic Officer Greeting */}
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
            <Sparkles className="h-3.5 w-3.5" />
            <span>National Metrology Enforcement Grid</span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            Officer Command & Analytics Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500 flex flex-wrap items-center gap-2">
            <span>Welcome,</span>
            <strong className="text-gray-900 font-bold">
              Officer {officer?.name || 'Rajesh Varma'}
            </strong>
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-mono text-blue-800 font-bold">
              {officer?.badgeId || 'INSP-GJ-2041'}
            </span>
            <span>• Jurisdiction:</span>
            <span className="font-semibold text-gray-700">
              {officer?.region || 'Ahmedabad Zone'}
            </span>
          </p>
        </div>

        {/* Action button to launch new scan */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/scanner')}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-blue-500/35 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span>Launch Package Scan</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Dynamic Top Metric Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div
              key={idx}
              className="group rounded-3xl border border-slate-200/90 bg-white/90 backdrop-blur-md p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-700 transition-colors">
                  {metric.label}
                </span>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${metric.bgColor} shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className={`h-5 w-5 ${metric.iconColor}`} />
                </div>
              </div>

              <div className="mt-4">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {metric.value}
                </span>
                <p className="mt-1.5 text-xs font-semibold text-slate-500">
                  {metric.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Analytics & Trends Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Category Breakdown (7 cols) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-7">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Category-wise Violation Distribution
              </h2>
              <p className="text-xs text-gray-500">
                Proportion of non-compliant packaged commodities flagged by automated OCR
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Active Cycle</span>
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {categoryStats.map((item) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-gray-700 font-semibold">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">
                      {item.violations} violations / {item.count} tests
                    </span>
                    <span className="font-bold text-gray-900">{item.percentage}%</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Quick Notice */}
          <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50/80 p-3 text-xs text-gray-600">
            <span className="font-semibold text-gray-900">Enforcement Insight: </span>
            Food & Beverages commodities account for over 40% of all dual-labeling and smudged batch date offenses under Section 36.
          </div>
        </div>

        {/* Regional Enforcement Highlights (5 cols) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-5">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-base font-bold text-gray-900">
              Recent Enforcement Highlights
            </h2>
            <p className="text-xs text-gray-500">
              Compounded offenses and statutory seizure notices
            </p>
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50/60 p-3.5">
              <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-rose-950">
                  Connaught Place Retailer Compounded
                </h4>
                <p className="text-xs text-rose-800">
                  ₹50,000 compounding penalty imposed for selling pre-packaged goods exceeding declared MRP.
                </p>
                <span className="text-[10px] text-rose-600 font-medium block">
                  Rule 18(2) Violation • Today at 10:45 AM
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/60 p-3.5">
              <TriangleAlert className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-amber-950">
                  Okhla Depot Net Content Audit
                </h4>
                <p className="text-xs text-amber-800">
                  Packaged edible oil lot flagged for -4.2% short measure variance below Fifth Schedule limits.
                </p>
                <span className="text-[10px] text-amber-600 font-medium block">
                  Section 30 Notice • Today at 09:55 AM
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3.5">
              <CircleCheck className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-blue-950">
                  Shahdara Warehouse Clearance
                </h4>
                <p className="text-xs text-blue-800">
                  4 batches of household commodities verified compliant with standard unit sale price disclosures.
                </p>
                <span className="text-[10px] text-blue-600 font-medium block">
                  Audited by INSP-DL-305
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Dynamic Recent Inspection Logs Table */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* Table Header & Category Filter */}
        <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Recent Packaging Inspection Records
            </h2>
            <p className="text-xs text-gray-500">
              Live ledger of automated OCR evaluations and field officer verdicts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">Filter:</span>
            <div className="relative">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="appearance-none rounded-lg border border-gray-300 bg-white py-1.5 pl-3 pr-8 text-xs font-medium text-gray-700 shadow-sm transition hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="All">All Commodities</option>
                <option value="Food & Beverages">Food & Beverages</option>
                <option value="Personal Care & Cosmetics">Personal Care & Cosmetics</option>
                <option value="Household Commodities">Household Commodities</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400">
                <Layers className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Responsive Table Container */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3">Package / Commodity</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Officer</th>
                <th className="py-3 px-3">Verdict / Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                  {/* Package Name & ID */}
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-gray-900 block">{log.productName}</span>
                    <span className="text-[10px] text-gray-400 font-mono">#{log.id}</span>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-3">
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                      {log.category}
                    </span>
                  </td>

                  {/* Location */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-1 text-gray-600 max-w-[220px] truncate">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span className="truncate">{log.location}</span>
                    </div>
                  </td>

                  {/* Officer Name & ID */}
                  <td className="py-3.5 px-3">
                    <span className="font-medium text-gray-900 block">{log.officerName}</span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {log.inspectionDate}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-3">
                    {log.verdict === 'Compliant' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        <CircleCheck className="h-3 w-3" />
                        Compliant
                      </span>
                    )}

                    {log.verdict === 'Non-Compliant' && (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20">
                          <ShieldAlert className="h-3 w-3" />
                          Non-Compliant
                        </span>
                        {log.violations && log.violations[0] && (
                          <span className="block text-[10px] text-rose-600 font-medium">
                            {log.violations[0]}
                          </span>
                        )}
                      </div>
                    )}

                    {log.verdict === 'Manual Review' && (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
                          <TriangleAlert className="h-3 w-3" />
                          Manual Review
                        </span>
                        {log.violations && log.violations[0] && (
                          <span className="block text-[10px] text-amber-700 font-medium">
                            {log.violations[0]}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => navigate('/reports')}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <span>View Dossier</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info & export */}
        <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-4 text-xs text-gray-500 sm:flex-row">
          <span>Showing {filteredLogs.length} active records dynamically synchronized with field devices.</span>
          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-700"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Enforcement Dossiers (PDF / CSV)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
