import { useState } from 'react';
import {
  Settings,
  Shield,
  Database,
  RefreshCw,
  Check,
} from 'lucide-react';
import { useTriNetra } from '../context/TriNetraContext';
import { DEFAULT_USERS } from '../constants/seedUsers';

export default function SystemSettings() {
  const { officer } = useTriNetra();
  const [resetMessage, setResetMessage] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleResetDemoData = () => {
    setIsResetting(true);
    setResetMessage('');

    try {
      // Re-seed default users and default reports
      localStorage.setItem('users', JSON.stringify(DEFAULT_USERS));
      localStorage.setItem('trinetra_registered_officers', JSON.stringify(DEFAULT_USERS));
      setResetMessage('Default state database re-synchronized successfully.');
    } catch (e) {
      setResetMessage('Failed to reset storage.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-300/60">
          <Settings className="h-3.5 w-3.5" />
          <span>Admin System Configuration</span>
        </div>
        <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight sm:text-3xl">
          Portal & RBAC System Settings
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Security protocols, regional jurisdiction mappings, and local persistence controls.
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
              <p>Granted executive oversight across all 5 districts (Ahmedabad, Surat, Rajkot, Gandhinagar, Vadodara) and full ledger inspection logs.</p>
            </div>
          </div>
        </div>

        {/* Database & LocalStorage Management Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Storage & System Synchronization</h3>
              <p className="text-xs text-slate-400">LocalStorage Keys: users, activeSession, trinetra_reports</p>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Active logged-in session: <strong className="text-slate-800">{officer?.name}</strong> ({officer?.badgeId} • {officer?.role}).
          </p>

          {resetMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>{resetMessage}</span>
            </div>
          )}

          <div className="pt-3">
            <button
              type="button"
              disabled={isResetting}
              onClick={handleResetDemoData}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
            >
              <RefreshCw className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
              <span>Re-seed System Seed Accounts</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
