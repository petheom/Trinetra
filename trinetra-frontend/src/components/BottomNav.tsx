import { Link, useLocation } from 'react-router-dom';
import { Camera, CheckCircle2, FileText, LayoutDashboard } from 'lucide-react';
import { useTriNetra } from '../context/TriNetraContext';

export default function BottomNav() {
  const location = useLocation();
  const { officer } = useTriNetra();

  // Read active role safely from context or storage fallback
  const activeRole =
    officer?.role ||
    (() => {
      try {
        const s = localStorage.getItem('activeSession');
        if (s) return JSON.parse(s)?.role;
      } catch {}
      return 'Field Officer';
    })();

  // Field Officer gets: Scanner, Verification, Dossier, and Dashboard
  // Admin gets: Dashboard, and Dossiers
  const navItems =
    activeRole === 'Admin'
      ? [
          {
            label: 'Dashboard',
            path: '/admin-dashboard',
            matchPaths: ['/admin-dashboard', '/admin', '/dashboard'],
            icon: LayoutDashboard,
          },
          {
            label: 'Dossiers',
            path: '/reports',
            matchPaths: ['/reports'],
            icon: FileText,
          },
        ]
      : [
          {
            label: 'Scanner',
            path: '/scanner',
            matchPaths: ['/scanner', '/inspection'],
            icon: Camera,
          },
          {
            label: 'Verify',
            path: '/verification',
            matchPaths: ['/verification'],
            icon: CheckCircle2,
          },
          {
            label: 'Dossier',
            path: '/reports',
            matchPaths: ['/reports'],
            icon: FileText,
          },
          {
            label: 'Dashboard',
            path: '/dashboard',
            matchPaths: ['/dashboard'],
            icon: LayoutDashboard,
          },
        ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/90 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
    >
      <div className="flex items-center justify-around px-2 pt-1.5 pb-1">
        {navItems.map((item) => {
          const isActive = item.matchPaths.some((p) =>
            p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)
          );
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-1 flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-blue-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <div
                className={`relative flex items-center justify-center h-8 w-12 rounded-full transition-all duration-200 ${
                  isActive ? 'bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30' : ''
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {isActive && (
                  <span className="absolute -bottom-0.5 h-1 w-2 rounded-full bg-blue-400" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
