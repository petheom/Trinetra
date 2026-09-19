import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { TriNetraProvider, useTriNetra } from './context/TriNetraContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import Landing from './pages/Landing';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import Verification from './pages/Verification';
import Reports from './pages/Reports';

// Protected Route Guard with Dedicated Officer Workspace Wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { officer } = useTriNetra();

  // Safe check against state and localStorage to prevent false redirects
  if (!officer) {
    try {
      const saved = localStorage.getItem('trinetra_officer');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.badgeId) {
          return <div className="w-full animate-in fade-in duration-200">{children}</div>;
        }
      }
    } catch (e) {
      console.warn('Error reading stored officer session:', e);
    }

    return <Navigate to="/login" replace />;
  }

  return (
    <div className="w-full animate-in fade-in duration-200">
      {children}
    </div>
  );
}

// Shell layout managing sticky navbar, viewports, and conditional footer
function AppShell() {
  const location = useLocation();

  // Determine if active page is an internal working workspace
  const isWorkingPage = ['/dashboard', '/scanner', '/verification', '/reports'].some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isWorkingPage ? 'bg-slate-50 text-slate-900' : 'bg-gray-50 text-gray-900'
      }`}
    >
      {/* Sticky Universal Navigation Bar */}
      <Navbar />

      {/* Main Page Content Viewport */}
      <main
        className={`mx-auto w-full flex-1 ${
          isWorkingPage
            ? 'max-w-7xl px-4 py-6 sm:px-6 lg:px-8'
            : 'max-w-7xl p-4 sm:p-6 lg:p-8'
        }`}
      >
        <Routes>
          {/* Public Portal Pages & Aliases */}
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/about-us" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/contact-us" element={<Contact />} />

          {/* Authentication Routes & Aliases */}
          <Route path="/login" element={<Login initialMode="login" />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/register" element={<Signup />} />

          {/* Protected Officer Workflow Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scanner"
            element={
              <ProtectedRoute>
                <Scanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verification"
            element={
              <ProtectedRoute>
                <Verification />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Render Public Government Footer ONLY on public portal pages (completely hidden on working officer views) */}
      {!isWorkingPage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <TriNetraProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <AppShell />
          </ErrorBoundary>
        </BrowserRouter>
      </TriNetraProvider>
    </ErrorBoundary>
  );
}
