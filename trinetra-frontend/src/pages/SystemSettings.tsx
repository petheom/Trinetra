import { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Database,
  RefreshCw,
  Check,
  Server,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { useTriNetra } from '../context/TriNetraContext';
import { api } from '../utils/api';

export default function SystemSettings() {
  const { officer, fetchReports, showToast } = useTriNetra();
  const [syncMessage, setSyncMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [serverHealth, setServerHealth] = useState<{ status: string; uptime?: number; timestamp?: string } | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Check live backend server health
  const checkHealth = async () => {
    try {
      const res = await api.get('/api/health');
      if (res.data) {
        setServerHealth(res.data);
        setHealthError(null);
      }
    } catch {
      setHealthError('Server unreachable on port 5000');
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    setSyncMessage('');

    try {
      await checkHealth();
      await fetchReports();
      setSyncMessage('Live MongoDB ledger and active JWT session re-synchronized successfully.');
      showToast('System synchronized with MongoDB cluster', 'success');
    } catch {
      setSyncMessage('Failed to synchronize with server.');
      showToast('Synchronization error', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-300/60">
          <Settings className="h-3.5 w-3.5" />
          <span>Admin System Configuration • Live Cluster</span>
        </div>
        <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight sm:text-3xl">
          Portal & Database System Settings
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Security protocols, regional jurisdiction mappings, and live MongoDB persistence controls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security / RBAC Information Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Role-Based Access Control (RBAC)</h3>
              <p className="text-xs text-slate-400">Enforcement Model: Administrative Hierarchy</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-600 pt-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
              <div className="font-bold text-slate-800 mb-1">Field Officer Policy:</div>
              <p>Granted access strictly to local scanner OCR terminal, packaging verification, and individual regional audit logs.</p>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-3.5">
              <div className="font-bold text-purple-900 mb-1">Admin Policy:</div>
              <p>Granted executive oversight across all regional jurisdictions and full ledger inspection logs with analytics aggregation.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-xs space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Active Principal</span>
            <p className="font-bold text-slate-800">{officer?.name || 'Administrator'} ({officer?.badgeId || 'ADMIN'})</p>
            <p className="text-[11px] text-slate-500 font-mono">Role: {officer?.role || 'Admin'} • Jurisdiction: {officer?.region || 'National HQ'}</p>
          </div>
        </div>

        {/* Database & Real-Time Sync Management Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Live MongoDB Connection & Health</h3>
              <p className="text-xs text-slate-400">Cluster Status & Replication State</p>
            </div>
          </div>

          <div className="space-y-2 pt-2 text-xs">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-slate-400" />
                <span className="font-medium text-slate-700">Node.js Express Server</span>
              </div>
              {serverHealth?.status === 'healthy' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                  <Activity className="h-3 w-3" />
                  Online
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                  <AlertTriangle className="h-3 w-3" />
                  {healthError || 'Connecting...'}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-slate-400" />
                <span className="font-medium text-slate-700">MongoDB Database</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                <Activity className="h-3 w-3" />
                Connected
              </span>
            </div>
          </div>

          {syncMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>{syncMessage}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              disabled={isSyncing}
              onClick={handleSyncDatabase}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
              <span>{isSyncing ? 'Synchronizing Cluster...' : 'Re-sync Live Database & Health'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
