import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Eye,
  LayoutDashboard,
  ScanLine,
  FileText,
  LogOut,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  Shield,
  ClipboardList,
  BarChart3,
  Settings,
  MapPin,
  Database,
} from 'lucide-react';
import { useTriNetra, type UserRole } from '../context/TriNetraContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { officer, logout, reports } = useTriNetra();

  // Safely determine active role from context or fallback to localStorage
  const activeRole: UserRole = (() => {
    if (officer?.role) return officer.role;
    try {
      const session = localStorage.getItem('activeSession');
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed?.role) return parsed.role as UserRole;
      }
    } catch (e) {
      console.warn('Failed to parse activeSession in Sidebar:', e);
    }
    return 'Field Officer';
  })();

  const isAdmin = activeRole === 'Admin';

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

  const isDashboardActive = location.pathname === '/dashboard';
  const isAdminDashboardActive = location.pathname.startsWith('/admin');
  const isScannerActive = location.pathname.startsWith('/scanner') || location.pathname.startsWith('/inspection') || location.pathname.startsWith('/verification');
  const isReportsActive = location.pathname.startsWith('/reports');
  const isOfficerLogsActive = location.pathname.startsWith('/officer-logs');
  const isRegionalAnalyticsActive = location.pathname.startsWith('/regional-analytics');
  const isSystemSettingsActive = location.pathname.startsWith('/system-settings');

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`print:hidden fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-100 border-r border-slate-800 shadow-2xl transition-all duration-300 ease-in-out
          ${/* Mobile drawer positioning */ ''}
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${/* Desktop fixed positioning & width */ ''}
          lg:translate-x-0 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
          w-72
        `}
      >
        {/* Subtle Government National Accent Bar */}
        <div className="h-1 w-full shrink-0 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

        {/* Sidebar Header: Brand & Identity */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800/80 px-4">
          <Link
            to="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3 transition-opacity hover:opacity-90 overflow-hidden"
            title="TriNetra Enterprise Portal"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-white/20">
              <Eye className="h-5 w-5" />
            </div>

            {(!isCollapsed || isOpen) && (
              <div className="flex flex-col min-w-0 transition-opacity duration-200">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-lg tracking-tight text-white">
                    Tri<span className="text-blue-400">Netra</span>
                  </span>
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ring-1 ${
                    isAdmin
                      ? 'bg-purple-500/20 text-purple-300 ring-purple-400/30'
                      : 'bg-blue-500/20 text-blue-300 ring-blue-400/30'
                  }`}>
                    {isAdmin ? 'Admin' : 'Officer'}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-400 tracking-wide truncate">
                  Legal Metrology System
                </span>
              </div>
            )}
          </Link>

          {/* Close button for mobile drawer */}
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden transition"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Desktop Collapse Toggle in header */}
          {onToggleCollapse && !isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation Links Area - DYNAMIC ROLE-BASED NAVIGATION */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
          <div>
            {(!isCollapsed || isOpen) && (
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isAdmin ? 'Administration Hub' : 'Field Operations'}
              </p>
            )}

            <nav className="space-y-1.5">
              {isAdmin ? (
                /* ================= ADMIN ROLE NAVIGATION ================= */
                <>
                  {/* 1. Admin Overview */}
                  <Link
                    to="/dashboard"
                    onClick={onClose}
                    title={isCollapsed ? 'Admin Overview' : undefined}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                      isDashboardActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-900/30'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isDashboardActive
                          ? 'bg-white/20 text-white'
                          : 'text-slate-400 group-hover:text-blue-400 group-hover:bg-slate-800'
                      }`}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                    </div>

                    {(!isCollapsed || isOpen) && (
                      <div className="flex flex-1 items-center justify-between min-w-0">
                        <span className="truncate">Admin Overview</span>
                        {isDashboardActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white shadow-xs" />
                        )}
                      </div>
                    )}
                  </Link>

                  {/* Admin Live Data Grid */}
                  <Link
                    to="/admin-dashboard"
                    onClick={onClose}
                    title={isCollapsed ? 'Admin Data Grid' : undefined}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                      isAdminDashboardActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-900/30'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isAdminDashboardActive
                          ? 'bg-white/20 text-white'
                          : 'text-slate-400 group-hover:text-blue-400 group-hover:bg-slate-800'
                      }`}
                    >
                      <Database className="h-4 w-4" />
                    </div>

                    {(!isCollapsed || isOpen) && (
                      <div className="flex flex-1 items-center justify-between min-w-0">
                        <span className="truncate">Admin Data Grid</span>
                        <span className="rounded-full bg-blue-500/20 text-blue-300 px-1.5 py-0.5 text-[9px] font-bold border border-blue-400/30">
                          Live
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* 2. Officer Logs */}
                  <Link
                    to="/officer-logs"
                    onClick={onClose}
                    title={isCollapsed ? 'Officer Logs' : undefined}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                      isOfficerLogsActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-900/30'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isOfficerLogsActive
                          ? 'bg-white/20 text-white'
                          : 'text-slate-400 group-hover:text-blue-400 group-hover:bg-slate-800'
                      }`}
                    >
                      <ClipboardList className="h-4 w-4" />
                    </div>

                    {(!isCollapsed || isOpen) && (
                      <div className="flex flex-1 items-center justify-between min-w-0">
                        <span className="truncate">Officer Logs</span>
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                          {reports?.length ?? 5}
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* 3. Regional Analytics */}
                  <Link
                    to="/regional-analytics"
                    onClick={onClose}
                    title={isCollapsed ? 'Regional Analytics' : undefined}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                      isRegionalAnalyticsActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-900/30'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isRegionalAnalyticsActive
                          ? 'bg-white/20 text-white'
                          : 'text-slate-400 group-hover:text-blue-400 group-hover:bg-slate-800'
                      }`}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </div>

                    {(!isCollapsed || isOpen) && (
                      <div className="flex flex-1 items-center justify-between min-w-0">
                        <span className="truncate">Regional Analytics</span>
                        {isRegionalAnalyticsActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white shadow-xs" />
                        )}
                      </div>
                    )}
                  </Link>

                  {/* 4. System Settings */}
                  <Link
                    to="/system-settings"
                    onClick={onClose}
                    title={isCollapsed ? 'System Settings' : undefined}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                      isSystemSettingsActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-900/30'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isSystemSettingsActive
                          ? 'bg-white/20 text-white'
                          : 'text-slate-400 group-hover:text-blue-400 group-hover:bg-slate-800'
                      }`}
                    >
                      <Settings className="h-4 w-4" />
                    </div>

                    {(!isCollapsed || isOpen) && (
                      <div className="flex flex-1 items-center justify-between min-w-0">
                        <span className="truncate">System Settings</span>
                        {isSystemSettingsActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white shadow-xs" />
                        )}
                      </div>
                    )}
                  </Link>
                </>
              ) : (
                /* ================= FIELD OFFICER ROLE NAVIGATION ================= */
                <>
                  {/* 1. Dashboard */}
                  <Link
                    to="/dashboard"
                    onClick={onClose}
                    title={isCollapsed ? 'Dashboard' : undefined}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                      isDashboardActive
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-md shadow-blue-900/30'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isDashboardActive
                          ? 'bg-white/20 text-white'
                          : 'text-slate-400 group-hover:text-blue-400 group-hover:bg-slate-800'
                      }`}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                    </div>

                    {(!isCollapsed || isOpen) && (
                      <div className="flex flex-1 items-center justify-between min-w-0">
                        <span className="truncate">Dashboard</span>
                        {isDashboardActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white shadow-xs" />
                        )}
                      </div>
                    )}
                  </Link>

                  {/* 2. Start Inspection (Scanner) */}
                  <Link
                    to="/scanner"
                    onClick={onClose}
                    title={isCollapsed ? 'Start Inspection' : undefined}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                      isScannerActive
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-md shadow-blue-900/30'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isScannerActive
                          ? 'bg-white/20 text-white'
                          : 'text-slate-400 group-hover:text-blue-400 group-hover:bg-slate-800'
                      }`}
                    >
                      <ScanLine className="h-4 w-4" />
                    </div>

                    {(!isCollapsed || isOpen) && (
                      <div className="flex flex-1 items-center justify-between min-w-0">
                        <span className="truncate">Start Inspection</span>
                        <span className="rounded bg-blue-500/30 px-1.5 py-0.5 text-[9px] font-extrabold text-blue-200">
                          Scanner
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* 3. My Reports */}
                  <Link
                    to="/reports"
                    onClick={onClose}
                    title={isCollapsed ? 'My Reports' : undefined}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                      isReportsActive
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-md shadow-blue-900/30'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isReportsActive
                          ? 'bg-white/20 text-white'
                          : 'text-slate-400 group-hover:text-blue-400 group-hover:bg-slate-800'
                      }`}
                    >
                      <FileText className="h-4 w-4" />
                    </div>

                    {(!isCollapsed || isOpen) && (
                      <div className="flex flex-1 items-center justify-between min-w-0">
                        <span className="truncate">My Reports</span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isReportsActive
                              ? 'bg-white/25 text-white'
                              : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                          }`}
                        >
                          {reports?.length ?? 5}
                        </span>
                      </div>
                    )}
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Quick System Badge / Status (When expanded) */}
          {(!isCollapsed || isOpen) && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-semibold text-slate-300 text-[11px]">
                  {isAdmin ? 'Admin Governance Grid' : 'Enforcement Protocol 2021'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                {isAdmin
                  ? 'All Gujarat regional inspection nodes connected & synced.'
                  : 'Weights & Packaging compliance scanner engine online.'}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Footer: Officer Profile & Logout */}
        <div className="shrink-0 border-t border-slate-800/80 p-3 bg-slate-950/40">
          {!isCollapsed || isOpen ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-2.5 border border-slate-700/60">
                <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white font-bold text-xs shadow-inner ${
                  isAdmin
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                    : 'bg-gradient-to-tr from-blue-600 to-indigo-600'
                }`}>
                  <User className="h-4 w-4" />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-xs text-white truncate">
                      {officer?.name || (isAdmin ? 'Director Amit Trivedi' : 'Rajesh Varma')}
                    </span>
                    <Shield className={`h-3 w-3 shrink-0 ${isAdmin ? 'text-purple-400' : 'text-blue-400'}`} />
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="font-mono text-blue-300 truncate">
                      {officer?.badgeId || (isAdmin ? 'ADMIN-HQ-01' : 'INSP-GJ-2041')}
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">{activeRole}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                    <MapPin className="h-3 w-3 text-slate-500" />
                    <span className="truncate">{officer?.region || (isAdmin ? 'Gandhinagar' : 'Ahmedabad')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-1.5 text-[11px] font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{activeRole} Active</span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-900/60 bg-rose-950/40 px-2 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-900/60 hover:text-white transition"
                  title="Sign out of account"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : (
            /* Icon-only footer when collapsed on desktop */
            <div className="flex flex-col items-center gap-2">
              <div
                className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-200"
                title={`${officer?.name || 'User'} (${activeRole} • ${officer?.region || 'HQ'})`}
              >
                <User className={`h-4 w-4 ${isAdmin ? 'text-purple-400' : 'text-blue-400'}`} />
                <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-slate-900" />
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-rose-400 hover:bg-rose-950/50 hover:text-rose-200 transition"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>

              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition"
                  title="Expand sidebar"
                  aria-label="Expand sidebar"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
