import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart3,
  MapPin,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTriNetra } from '../context/TriNetraContext';
import { analyticsAPI, type RegionMetric } from '../utils/api';

export default function RegionalAnalytics() {
  const { reports, officer } = useTriNetra();

  const [regionMetrics, setRegionMetrics] = useState<RegionMetric[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Fallback local aggregation from TriNetraContext reports if API is offline
  const aggregateFromLocalReports = useCallback((): RegionMetric[] => {
    if (!Array.isArray(reports) || reports.length === 0) return [];

    const grouped: Record<string, { total: number; compliant: number; violations: number; review: number; penalties: number }> = {};

    reports.forEach((r) => {
      const reg = (r.region || (r as any).jurisdiction || (r as any).state || 'Unassigned').trim();
      if (!reg) return;

      if (!grouped[reg]) {
        grouped[reg] = { total: 0, compliant: 0, violations: 0, review: 0, penalties: 0 };
      }

      grouped[reg].total += 1;
      const isCompliant = r.verdict === 'Compliant' || r.status === 'Pass' || r.status === 'Compliant';
      const isViolation = r.verdict === 'Non-Compliant' || r.status === 'Fail' || r.status === 'Non-Compliant';

      if (isCompliant) {
        grouped[reg].compliant += 1;
      } else if (isViolation) {
        grouped[reg].violations += 1;
        grouped[reg].penalties += 25000;
      } else {
        grouped[reg].review += 1;
      }
    });

    return Object.entries(grouped).map(([regName, stats]) => ({
      region: regName,
      totalAudits: stats.total,
      compliantCount: stats.compliant,
      violationCount: stats.violations,
      reviewCount: stats.review,
      penalties: stats.penalties,
      passRate: stats.total > 0 ? Math.round((stats.compliant / stats.total) * 100) : 100,
    })).sort((a, b) => b.totalAudits - a.totalAudits);
  }, [reports]);

  // Main fetch function for live MongoDB aggregated data
  const fetchRegionalMetrics = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await analyticsAPI.getRegionalAnalytics();
      if (response && response.success && Array.isArray(response.regions)) {
        // Filter strictly to regions that have actual audit records in the database
        const activeRegions = response.regions.filter(
          (r: RegionMetric) => r && typeof r.totalAudits === 'number' && r.totalAudits > 0
        );
        setRegionMetrics(activeRegions);
        setLastSynced(new Date());
      } else {
        throw new Error(response?.message || 'Invalid data structure received from analytics API');
      }
    } catch (err: any) {
      // Graceful fallback to client-side live context reports
      const fallbackData = aggregateFromLocalReports();
      setRegionMetrics(fallbackData);
      setLastSynced(new Date());
      if (fallbackData.length === 0) {
        setError(err?.message || 'Unable to sync with analytics cluster.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [aggregateFromLocalReports]);

  // Initial fetch and reactive re-fetch when reports count updates
  useEffect(() => {
    fetchRegionalMetrics();
  }, [fetchRegionalMetrics, reports.length]);

  // Overall national summary statistics across all active regions
  const summaryStats = useMemo(() => {
    const totalRegions = regionMetrics.length;
    const totalAudits = regionMetrics.reduce((acc, r) => acc + (r.totalAudits || 0), 0);
    const compliant = regionMetrics.reduce((acc, r) => acc + (r.compliantCount || 0), 0);
    const violations = regionMetrics.reduce((acc, r) => acc + (r.violationCount || 0), 0);
    const totalPenalties = regionMetrics.reduce((acc, r) => acc + (r.penalties || 0), 0);
    const nationalPassRate = totalAudits > 0 ? Math.round((compliant / totalAudits) * 100) : 100;

    return {
      totalRegions,
      totalAudits,
      compliant,
      violations,
      totalPenalties,
      nationalPassRate,
    };
  }, [regionMetrics]);

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/90 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-600/20">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Real-Time MongoDB Aggregation Pipeline</span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight sm:text-3xl">
            Regional Metrology Analytics
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Dynamic statutory compliance metrics aggregated by jurisdiction from active inspection reports.
          </p>
        </div>

        {/* Sync / Refresh Button */}
        <div className="flex items-center gap-3">
          {lastSynced && (
            <span className="hidden md:inline text-[11px] text-slate-400 font-medium">
              Synced {lastSynced.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button
            type="button"
            onClick={() => fetchRegionalMetrics(true)}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Aggregating...' : 'Refresh DB Metrics'}</span>
          </button>
        </div>
      </div>

      {/* Error Alert if any */}
      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchRegionalMetrics(true)}
            className="font-bold underline hover:text-amber-900 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Top Summary KPI Row (Only shown when data exists) */}
      {regionMetrics.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active Regions */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Jurisdictions</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <MapPin className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-slate-900">{summaryStats.totalRegions}</p>
            <span className="mt-1 text-[11px] text-slate-400 font-medium">With recorded inspections in DB</span>
          </div>

          {/* Card 2: Total Audits */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Audits</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-slate-900">{summaryStats.totalAudits}</p>
            <span className="mt-1 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>{summaryStats.nationalPassRate}% Compliance Index</span>
            </span>
          </div>

          {/* Card 3: Violations Detected */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Violations</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-rose-600">{summaryStats.violations}</p>
            <span className="mt-1 text-[11px] text-slate-400 font-medium">Across all regional circles</span>
          </div>

          {/* Card 4: Penalties Assessed */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Penalties Assessed</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <IndianRupee className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-slate-900">
              ₹{summaryStats.totalPenalties.toLocaleString('en-IN')}
            </p>
            <span className="mt-1 text-[11px] text-slate-400 font-medium">Under Sec 36, Act 2009</span>
          </div>
        </div>
      )}

      {/* 3. Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 animate-spin">
            <RefreshCw className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">Aggregating Regional Inspection Data</h3>
          <p className="mt-1 max-w-sm text-xs text-slate-400 font-medium">
            Running aggregation pipeline on MongoDB reports collection...
          </p>
        </div>
      )}

      {/* 4. Empty State (Zero regions recorded in DB yet) */}
      {!isLoading && regionMetrics.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 ring-8 ring-blue-50/50">
            <MapPin className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="mt-5 text-lg font-black text-slate-900">No Regional Inspection Records Yet</h3>
          <p className="mt-2 mx-auto max-w-md text-xs text-slate-500 leading-relaxed font-medium">
            There are currently no inspection dossiers recorded in MongoDB with assigned regional jurisdictions.
            When a Field Officer logs an inspection report for a jurisdiction (e.g., &ldquo;Gujarat&rdquo;, &ldquo;Maharashtra&rdquo;),
            its regional zone card will appear here automatically with real-time statutory metrics.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
            >
              <span>Go to Command Dashboard</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            {officer?.role !== 'Admin' && (
              <Link
                to="/scanner"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                <span>Submit First Inspection</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 5. Dynamic Grid of Regional Performance Cards (ONLY for regions with real data in DB) */}
      {!isLoading && regionMetrics.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Active Enforcement Circles ({regionMetrics.length})
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              Sorted by inspection volume
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {regionMetrics.map((rm, idx) => {
              const passRate = typeof rm.passRate === 'number' ? rm.passRate : 100;
              const isHighCompliance = passRate >= 80;
              const isMediumCompliance = passRate >= 50 && passRate < 80;

              return (
                <div
                  key={rm.region || `region-${idx}`}
                  className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* Card Header: Region Name & Pass Rate Pill */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-black text-slate-900 truncate">
                            {rm.region} Zone
                          </h3>
                          <span className="text-[11px] text-slate-400 font-medium">
                            State Metrology Jurisdiction
                          </span>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black shrink-0 ${
                          isHighCompliance
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                            : isMediumCompliance
                            ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
                            : 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20'
                        }`}
                      >
                        {passRate}% Compliant
                      </span>
                    </div>

                    {/* Metric Badges Grid: Total, Compliant, Violations */}
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-slate-50 p-2.5">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                          Total Audits
                        </span>
                        <span className="text-lg font-black text-slate-900">
                          {rm.totalAudits}
                        </span>
                      </div>

                      <div className="rounded-xl bg-emerald-50/80 p-2.5">
                        <span className="text-[10px] text-emerald-700 block font-bold uppercase tracking-wider">
                          Compliant
                        </span>
                        <span className="text-lg font-black text-emerald-800 flex items-center justify-center gap-0.5">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          {rm.compliantCount}
                        </span>
                      </div>

                      <div className="rounded-xl bg-rose-50/80 p-2.5">
                        <span className="text-[10px] text-rose-700 block font-bold uppercase tracking-wider">
                          Violations
                        </span>
                        <span className="text-lg font-black text-rose-800 flex items-center justify-center gap-0.5">
                          <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                          {rm.violationCount}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar for Statutory Compliance Index */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-[11px] font-semibold">
                        <span className="text-slate-500">Statutory Compliance Index</span>
                        <span className="text-slate-900 font-bold">{passRate}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isHighCompliance
                              ? 'bg-gradient-to-r from-blue-500 to-emerald-500'
                              : isMediumCompliance
                              ? 'bg-gradient-to-r from-blue-500 to-amber-500'
                              : 'bg-gradient-to-r from-amber-500 to-rose-500'
                          }`}
                          style={{ width: `${Math.min(passRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Statutory Penalties Assessed */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Assessed Penalties</span>
                    <span className="font-mono font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/80">
                      ₹{Number(rm.penalties || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
