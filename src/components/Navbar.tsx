import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Eye,
  LayoutDashboard,
  QrCode,
  ShieldCheck,
  FileText,
  LogOut,
  User,
  LogIn,
  UserPlus,
  Menu,
  X,
  Home,
  Info,
  LifeBuoy,
} from 'lucide-react';
import { useTriNetra } from '../context/TriNetraContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { officer, logout } = useTriNetra();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  // Dynamic Navigation Items tailored for public vs authenticated officer modes
  const navLinks = officer
    ? [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/scanner', label: 'Scanner', icon: QrCode },
        { path: '/verification', label: 'Verification', icon: ShieldCheck },
        { path: '/reports', label: 'Reports', icon: FileText },
        { path: '/about', label: 'About Us', icon: Info },
        { path: '/contact', label: 'Contact Us', icon: LifeBuoy },
      ]
    : [
        { path: '/', label: 'Home', icon: Home },
        { path: '/about', label: 'About Us', icon: Info },
        { path: '/contact', label: 'Contact Us', icon: LifeBuoy },
      ];

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur-md shadow-xs">
      {/* Subtle National Tricolor Accent Line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        {/* 1. Extreme Left: Brand Logo & Title Only */}
        <div className="flex items-center shrink-0">
          <Link
            to={officer ? '/dashboard' : '/'}
            onClick={closeMenu}
            className="flex items-center gap-2.5 font-bold text-lg text-blue-600 transition hover:opacity-90 shrink-0"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white shadow-md shadow-blue-500/20">
              <Eye className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="tracking-tight text-gray-900 font-black text-lg">
                Tri<span className="text-blue-600">Netra</span>
              </span>
              <span className="hidden sm:inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                Portal
              </span>
            </div>
          </Link>
        </div>

        {/* 2. Right Side: Grouped Navigation Links + Auth Buttons */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4 ml-auto">
          {/* Navigation Links grouped neatly on the right */}
          <nav className="flex items-center gap-1 rounded-full border border-gray-200/90 bg-gray-50/90 p-1 shadow-2xs">
            {navLinks.map((item) => {
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-blue-600 font-bold shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                  }`}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Vertical Separator */}
          <div className="h-5 w-px bg-gray-200 shrink-0" />

          {/* Authentication Actions & Officer Profile */}
          <div className="flex items-center gap-2.5 shrink-0">
            {officer ? (
              <div className="flex items-center gap-2">
                {/* Compact Officer Pill */}
                <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50/90 py-1 pl-1.5 pr-3 text-xs text-gray-700 shadow-xs">
                  <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-[10px]">
                    <User className="h-3 w-3" />
                    <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                  </div>
                  <div className="text-left leading-tight">
                    <span className="block font-bold text-gray-900 text-xs truncate max-w-[120px]">
                      {officer.name}
                    </span>
                    <span className="block text-[10px] text-gray-400 font-mono">
                      {officer.badgeId}
                    </span>
                  </div>
                </div>

                {/* Compact Sign Out Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  title="End Officer Session"
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-xs transition hover:bg-rose-50 hover:border-rose-200"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-700 shadow-xs transition hover:bg-gray-50 hover:border-gray-400"
                >
                  <LogIn className="h-3.5 w-3.5 text-blue-600" />
                  <span>Login</span>
                </Link>

                <Link
                  to="/signup"
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700 hover:shadow-sm"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 3. Mobile Hamburger Button (visible on mobile only) */}
        <div className="flex items-center gap-2 md:hidden">
          {officer && (
            <div className="sm:hidden flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[11px] font-bold text-gray-800">
              <span className="truncate max-w-[80px]">
                {officer.name ? officer.name.split(' ')[0] : 'Officer'}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-xl p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* 4. Mobile Dropdown Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="border-b border-gray-200 bg-white px-4 pt-2 pb-5 md:hidden animate-in slide-in-from-top duration-150">
          <div className="space-y-1">
            <p className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Navigation
            </p>
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMenu}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Auth Bottom Bar */}
          <div className="mt-4 border-t border-gray-100 pt-3">
            {officer ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs">
                  <div>
                    <span className="block font-bold text-gray-900">{officer.name}</span>
                    <span className="block text-gray-400 font-mono text-[10px]">
                      {officer.badgeId} • {officer.region}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Active
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-2 text-xs font-bold text-rose-700 shadow-xs transition hover:bg-rose-100"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out Session</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2 text-xs font-bold text-gray-800 shadow-xs transition hover:bg-gray-50"
                >
                  <LogIn className="h-3.5 w-3.5 text-blue-600" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/signup"
                  onClick={closeMenu}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
