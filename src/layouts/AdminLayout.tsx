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
    logout();
    navigate('/login');
  };

  // Determine current page title & context for dynamic header breadcrumbs
  const getPageInfo = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) {
      return { title: 'Operational Dashboard', subtitle: 'Real-time Enforcement & Metrics' };
    }
    if (path.startsWith('/scanner') || path.startsWith('/inspection')) {
      return { title: 'Inspection Scanner', subtitle: 'Optical Label Capture & Analysis' };
    }
    if (path.startsWith('/verification')) {
      return { title: 'Statutory Verification', subtitle: 'Automated Rule 2021 Compliance' };
    }
    if (path.startsWith('/reports')) {
      return { title: 'Inspection Records & Seizure Memos', subtitle: 'Audit Trail & Legal Notices' };
    }
    return { title: 'Officer Workspace', subtitle: 'Legal Metrology Control Console' };
  };

  const pageInfo = getPageInfo();
  const badgeId = officer?.badgeId || 'INSP-DL-402';
  const officerName = officer?.name || 'Officer Rajesh Varma';

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex">
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
        {/* Minimal Enterprise Top-Bar */}
        <header className="print:hidden sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 sm:px-6 lg:px-8 backdrop-blur-md shadow-2xs">
          {/* Top-Bar Left: Mobile Hamburger, Desktop Toggle & Breadcrumbs */}
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 lg:hidden transition"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop Quick Collapse/Expand Button */}
            <button
              type="button"
              onClick={() => setIsDesktopCollapsed((prev) => !prev)}
              className="hidden lg:inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
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
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                <span className="hidden sm:inline">TriNetra Portal</span>
                <ChevronRight className="hidden sm:inline h-3 w-3 text-slate-300" />
                <span className="text-blue-600 font-semibold">{pageInfo.title}</span>
              </div>
              <span className="hidden md:inline text-[11px] text-slate-500 font-normal">
                {pageInfo.subtitle}
              </span>
            </div>
          </div>

          {/* Top-Bar Right: System Status, Officer Badge ID & Logout Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Enforcement Node Status Pill */}
            <div className="hidden xl:flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/70 px-3 py-1 text-xs font-medium text-emerald-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>National Metrology Grid • Online</span>
            </div>

            {/* Quick Link to Scan on small viewports */}
            <Link
              to="/scanner"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/70 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100/70 transition"
            >
              <Sparkles className="h-3 w-3 text-blue-600" />
              <span>Quick Scan</span>
            </Link>

            {/* Logged-in Officer Badge ID Pill */}
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/90 py-1 pl-1.5 pr-3 text-xs text-slate-800 shadow-2xs">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-[10px] shadow-xs">
                <Shield className="h-3 w-3" />
              </div>
              <div className="flex flex-col text-left leading-tight">
                <span className="font-bold text-slate-900 text-xs truncate max-w-[100px] sm:max-w-[140px]">
                  {officerName}
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-semibold">
                  Badge: {badgeId}
                </span>
              </div>
            </div>

            {/* Minimal Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              title="Logout session"
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/90 bg-rose-50/60 px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-2xs transition hover:bg-rose-100 hover:border-rose-300 hover:text-rose-800"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Dynamic Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div key={location.pathname} className="w-full animate-fade-in">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}
