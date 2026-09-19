import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { TriNetraProvider, useTriNetra, type UserRole } from './context/TriNetraContext';

import ErrorBoundary from './components/ErrorBoundary';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import Verification from './pages/Verification';
import Reports from './pages/Reports';
import OfficerLogs from './pages/OfficerLogs';
import RegionalAnalytics from './pages/RegionalAnalytics';
import SystemSettings from './pages/SystemSettings';
import AdminDashboard from './pages/AdminDashboard';

// 1. Clean Enterprise Auth Layout: displays clean TriNetra logo & brand with ZERO public navbar links
function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-900 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Subtle National Tricolor Accent Bar */}
      <div className="h-1 w-full shrink-0 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

      {/* Clean Brand Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
            <Eye className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xl tracking-tight text-white leading-none">
                Tri<span className="text-blue-400">Netra</span>
              </span>
              <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-blue-300 ring-1 ring-blue-400/30">
                Enterprise
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">
              Legal Metrology Division • Govt of India
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-800/60 px-3 py-1 text-xs text-slate-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="hidden sm:inline font-medium text-slate-300">National Metrology Grid Active</span>
        </div>
      </header>

      {/* Centered Authentication Viewport */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full animate-fade-in">
          <Outlet />
        </div>
      </main>

      {/* Clean Minimalist Security Notice */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-800/60">
        © 2026 Legal Metrology Division • Standard Weights & Measures Regulatory Grid
      </footer>
    </div>
  );
}

// 2. Safe helper to check activeSession in localStorage
function getSafeActiveSession() {
  try {
    const raw = localStorage.getItem('activeSession') || localStorage.getItem('trinetra_officer');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.badgeId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading session from localStorage:', e);
  }
  return null;
}

// 3. Helper to safely read active role
function getActiveRole(contextRole?: UserRole): UserRole {
  if (contextRole) return contextRole;
  const session = getSafeActiveSession();
  if (session && session.role) {
    return session.role as UserRole;
  }
  return 'Field Officer';
}

// 4. Authenticated Layout wrapper - Guarantees NO infinite loop
function ProtectedLayout() {
  const { officer } = useTriNetra();
  const session = getSafeActiveSession();

  // If neither context nor localStorage has a valid session, safely navigate to login once
  if (!officer && !session) {
    return <Navigate to="/login" replace />;
  }

  return <AdminLayout />;
}

// 5. RoleProtectedRoute: restricts officer vs admin paths safely
interface RoleProtectedRouteProps {
  allowedRoles: UserRole[];
}

function RoleProtectedRoute({ allowedRoles }: RoleProtectedRouteProps) {
  const { officer } = useTriNetra();
  const activeRole = getActiveRole(officer?.role);

  if (!allowedRoles.includes(activeRole)) {
    // Redirect unauthorized user safely back to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

// 6. PublicOnlyRoute: If user already has an active session, send to dashboard; otherwise show auth
function PublicAuthRoute() {
  const { officer } = useTriNetra();
  const session = getSafeActiveSession();
  const location = useLocation();

  // If already logged in, redirect to /dashboard
  if (officer || session) {
    // Preserve any target location user was trying to access
    const stateObj = location.state as { from?: string } | null;
    return <Navigate to={stateObj?.from || '/dashboard'} replace />;
  }

  return <AuthLayout />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <TriNetraProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
              {/* Direct to Auth: Root path redirects cleanly to /login */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Clean Auth Routes: guarded by PublicAuthRoute to prevent redirect loops */}
              <Route element={<PublicAuthRoute />}>
                <Route path="/login" element={<Login initialMode="login" />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/register" element={<Signup />} />
              </Route>

              {/* Protected Workspace Routes (Sidebar + minimal Topbar via AdminLayout) */}
              <Route element={<ProtectedLayout />}>
                {/* Common dashboard accessible to both roles */}
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Field Operations & Packaging Inspection Routes (Accessible to Officers and Admins) */}
                <Route element={<RoleProtectedRoute allowedRoles={['Field Officer', 'Admin']} />}>
                  <Route path="/scanner" element={<Scanner />} />
                  <Route path="/inspection" element={<Scanner />} />
                  <Route path="/verification" element={<Verification />} />
                </Route>

                {/* Common reports route accessible by both Field Officers and Admins */}
                <Route path="/reports" element={<Reports />} />

                {/* Admin Only Routes */}
                <Route element={<RoleProtectedRoute allowedRoles={['Admin']} />}>
                  <Route path="/admin-dashboard" element={<AdminDashboard />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/officer-logs" element={<OfficerLogs />} />
                  <Route path="/regional-analytics" element={<RegionalAnalytics />} />
                  <Route path="/system-settings" element={<SystemSettings />} />
                </Route>
              </Route>

              {/* Catch-all redirect to /login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </TriNetraProvider>
    </ErrorBoundary>
  );
}
