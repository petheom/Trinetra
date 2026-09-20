import { useState, type ReactNode } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  LogOut,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useTriNetra } from '../context/TriNetraContext';

interface AdminLayoutProps {
  children?: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { officer, logout } = useTriNetra();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  const handleLogout = () => {
    try {
      logout();
      navigate('/login', { replace: true });
    } catch {
      window.location.href = '/login';
    }
  };

  // Determine current page title & context for dynamic header breadcrumbs
  const getPageInfo = () => {
    const path = location.pathname;
    if (path.startsWith('/admin-dashboard') || path === '/admin') {
      return { title: 'Admin Data Grid', subtitle: 'Live Global Enforcement Dossiers & Statutory Audit' };
    }
    if (path.startsWith('/dashboard')) {
      return { title: 'Operational Dashboard', subtitle: 'National Metrology Command & Oversight' };
    }
    if (path.startsWith('/scanner') || path.startsWith('/inspection')) {
      return { title: 'Packaging OCR Scanner', subtitle: 'Tesseract Neural Label Audit' };
    }
    if (path.startsWith('/verification')) {
      return { title: 'Statutory Verification', subtitle: 'Rules, 2011 Automated Inspection' };
    }
    if (path.startsWith('/reports')) {
      return { title: 'Enforcement Dossiers', subtitle: 'Statutory Audit Trail & Seizure Ledger' };
    }
    if (path.startsWith('/officer-logs')) {
      return { title: 'Officer Audit Logs', subtitle: 'Field Inspection Ledger & Evidence' };
    }
    if (path.startsWith('/regional-analytics')) {
      return { title: 'Regional Intelligence', subtitle: 'Statewide Compliance Metrics & Trends' };
    }
    if (path.startsWith('/system-settings')) {
      return { title: 'System Configuration', subtitle: 'Enterprise Node & Database Controls' };
    }
    return { title: 'Enterprise Portal', subtitle: 'Legal Metrology Control Console' };
  };

  const pageInfo = getPageInfo();
  const badgeId = officer?.badgeId || localStorage.getItem('badgeId') || 'INSP-GJ-2041';
  const officerName = officer?.name || 'Inspector Rajesh Varma';
  const officerRole = (officer?.role || localStorage.getItem('role') || localStorage.getItem('userRole') || 'Field Officer') as 'Admin' | 'Field Officer';
  const officerRegion = officer?.region || 'Gujarat';

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 flex">
      {/* 1. Fixed Left Enterprise Sidebar */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isDesktopCollapsed}
        onToggleCollapse={() => setIsDesktopCollapsed((prev) => !prev)}
      />

      {/* 2. Dynamic Right Content Column */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isDesktopCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        } print:pl-0`}
      >
        {/* Minimal Luxury Top-Bar */}
        <header className="print:hidden sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 sm:px-6 lg:px-8 backdrop-blur-md shadow-xs">
          {/* Top-Bar Left: Mobile Hamburger, Desktop Toggle & Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 lg:hidden transition cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop Quick Collapse/Expand Button */}
            <button
              type="button"
              onClick={() => setIsDesktopCollapsed((prev) => !prev)}
              className="hidden lg:inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
              title={isDesktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isDesktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isDesktopCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>

            {/* Breadcrumbs & Title */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 truncate">
                <span className="hidden sm:inline">TriNetra</span>
                <ChevronRight className="hidden sm:inline h-3 w-3 text-slate-300 shrink-0" />
                <span className="text-blue-600 font-bold truncate">{pageInfo.title}</span>
              </div>
              <span className="hidden md:inline text-[11px] text-slate-500 font-medium truncate">
                {pageInfo.subtitle}
              </span>
            </div>
          </div>

          {/* Top-Bar Right: System Status, Officer Profile Chip & Logout Button */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live Enforcement Node Status Pill */}
            <div className="hidden xl:flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>National Metrology Grid • Active</span>
            </div>

            {/* Quick Action Pill - Field Officer Only */}
            {officerRole !== 'Admin' && (
              <Link
                to="/scanner"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/90 px-3 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-xs cursor-pointer"
              >
                <Sparkles className="h-3 w-3 text-blue-600" />
                <span>OCR Scanner</span>
              </Link>
            )}

            {/* Officer Profile & Role Badge Pill */}
            <div className="flex items-center gap-2 sm:gap-3 rounded-2xl border border-slate-200/90 bg-white/95 py-1.5 pl-2 pr-3 sm:pr-3.5 shadow-xs">
              <div
                className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl text-white font-bold text-xs shadow-xs ${
                  officerRole === 'Admin'
                    ? 'bg-gradient-to-tr from-rose-600 to-red-600 ring-2 ring-rose-100'
                    : 'bg-gradient-to-tr from-emerald-600 to-teal-600 ring-2 ring-emerald-100'
                }`}
              >
                <Shield className="h-4 w-4" />
              </div>
              <div className="flex flex-col text-left leading-tight">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-bold text-slate-900 text-xs truncate max-w-[100px] sm:max-w-[150px]">
                    Welcome, <span className="font-mono text-blue-700">{badgeId}</span>
                  </span>
                  <span className="text-slate-300 font-normal">|</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs ${
                      officerRole === 'Admin'
                        ? 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-400/20'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-400/20'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        officerRole === 'Admin' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                      }`}
                    />
                    Role: {officerRole}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-400 truncate max-w-[160px] sm:max-w-[200px]">
                  {officerName} • {officerRegion}
                </span>
              </div>
            </div>

            {/* Minimal Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              title="Logout session"
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50/80 px-3 py-1.5 text-xs font-bold text-rose-700 shadow-xs transition hover:bg-rose-100 hover:text-rose-800 cursor-pointer active:scale-95"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Dynamic Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          <div key={location.pathname} className="max-w-7xl mx-auto w-full animate-fade-in">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}
