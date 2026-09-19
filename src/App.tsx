import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { TriNetraProvider, useTriNetra } from './context/TriNetraContext';

import ErrorBoundary from './components/ErrorBoundary';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import Verification from './pages/Verification';
import Reports from './pages/Reports';

// 1. Clean Enterprise Auth Layout: displays clean TriNetra logo & brand with ZERO public navbar links
function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-900 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Subtle National Tricolor Accent Bar */}
      <div className="h-1 w-full shrink-0 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

      {/* Clean Brand Header: TriNetra Logo Only, Zero public navbar links */}
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
          <span className="hidden sm:inline font-medium text-slate-300">Enforcement Gateway Active</span>
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

// 2. Protected Route Layout: wraps authenticated officer routes strictly inside AdminLayout
function ProtectedLayout() {
  const { officer } = useTriNetra();

  // Validate active officer state and fallback safely to persisted session
  if (!officer) {
    try {
      const saved = localStorage.getItem('trinetra_officer');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.badgeId) {
          return <AdminLayout />;
        }
      }
    } catch (e) {
      console.warn('Error verifying officer session:', e);
    }

    return <Navigate to="/login" replace />;
  }

  return <AdminLayout />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <TriNetraProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
              {/* Direct to Auth: Root path automatically redirects to /login */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Clean Auth Routes (TriNetra logo & form only, zero public navbar links) */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login initialMode="login" />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/register" element={<Signup />} />
              </Route>

              {/* Protected Officer Workspace Routes (Sidebar + minimal Topbar via AdminLayout) */}
              <Route element={<ProtectedLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/inspection" element={<Scanner />} />
                <Route path="/scanner" element={<Scanner />} />
                <Route path="/verification" element={<Verification />} />
                <Route path="/reports" element={<Reports />} />
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
