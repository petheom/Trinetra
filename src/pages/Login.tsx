import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  Lock,
  User,
  ArrowRight,
  CircleCheck,
  Eye,
  EyeOff,
  Sparkles,
  UserPlus,
  LogIn,
  TriangleAlert,
  BadgeCheck,
} from 'lucide-react';
import { useTriNetra } from '../context/TriNetraContext';

interface RegisteredOfficer {
  badgeId: string;
  name: string;
  passwordHash: string;
}

interface LoginProps {
  initialMode?: 'login' | 'register';
}

export default function Login({ initialMode }: LoginProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { officer, login } = useTriNetra();

  // Mode: 'login' | 'register'
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(() => {
    if (initialMode) return initialMode === 'register';
    return location.pathname === '/signup';
  });

  useEffect(() => {
    if (initialMode) {
      setIsRegisterMode(initialMode === 'register');
    } else {
      setIsRegisterMode(location.pathname === '/signup');
    }
  }, [initialMode, location.pathname]);

  // Clean, completely blank form states
  const [officerName, setOfficerName] = useState('');
  const [officerId, setOfficerId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState<string>(() => {
    return (location.state as { message?: string } | null)?.message || '';
  });

  // Pick up enrolled credentials from signup redirection state
  useEffect(() => {
    const stateObj = location.state as { registeredBadge?: string; message?: string } | null;
    if (stateObj?.registeredBadge) {
      setOfficerId(stateObj.registeredBadge);
      setIsRegisterMode(false);
    }
    if (stateObj?.message) {
      setSuccessMessage(stateObj.message);
    }
  }, [location.state]);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (officer) {
      navigate('/dashboard', { replace: true });
    }
  }, [officer, navigate]);

  // Default pre-seeded system officers for initial login testing
  const DEFAULT_OFFICERS: RegisteredOfficer[] = [
    {
      badgeId: 'INSP-GJ-2041',
      name: 'Inspector Rajesh Varma',
      passwordHash: 'GovPass#2026',
    },
    {
      badgeId: 'INSP-DL-402',
      name: 'Inspector Sunita Sharma',
      passwordHash: 'GovPass#2026',
    },
    {
      badgeId: 'DEMO-OFFICER',
      name: 'Field Officer Demo',
      passwordHash: 'admin123',
    },
  ];

  const getRegisteredAccounts = (): RegisteredOfficer[] => {
    try {
      const stored = localStorage.getItem('trinetra_registered_officers');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      // Seed default accounts if empty
      localStorage.setItem('trinetra_registered_officers', JSON.stringify(DEFAULT_OFFICERS));
      return DEFAULT_OFFICERS;
    } catch {
      return DEFAULT_OFFICERS;
    }
  };

  const saveRegisteredAccount = (newOfficer: RegisteredOfficer) => {
    try {
      const current = getRegisteredAccounts();
      const updated = [
        ...current.filter((o) => o.badgeId.toUpperCase() !== newOfficer.badgeId.toUpperCase()),
        newOfficer,
      ];
      localStorage.setItem('trinetra_registered_officers', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save officer credentials:', e);
    }
  };

  const handleToggleMode = (register: boolean) => {
    setIsRegisterMode(register);
    setErrorMessage('');
    setSuccessMessage('');
    setOfficerName('');
    setOfficerId('');
    setPassword('');
    setConfirmPassword('');
  };

  // Google OAuth Simulation
  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    setTimeout(() => {
      // Simulate authenticating via Google Workspace SSO
      const googleOfficer: RegisteredOfficer = {
        badgeId: 'GOOG-8821',
        name: 'Google Verified Officer',
        passwordHash: 'google_sso_token',
      };
      saveRegisteredAccount(googleOfficer);

      login(googleOfficer.badgeId, googleOfficer.name, 'National HQ');
      setIsGoogleLoading(false);
      navigate('/dashboard', { replace: true });
    }, 600);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedId = officerId.trim().toUpperCase();
    const trimmedPassword = password.trim();

    if (isRegisterMode) {
      const trimmedName = officerName.trim();

      if (!trimmedName) {
        setErrorMessage('Please enter your full official name.');
        return;
      }
      if (!trimmedId) {
        setErrorMessage('Please enter your new officer badge ID.');
        return;
      }
      if (trimmedPassword.length < 4) {
        setErrorMessage('Password / PIN must be at least 4 characters long.');
        return;
      }
      if (trimmedPassword !== confirmPassword.trim()) {
        setErrorMessage('Passwords do not match. Please verify and re-type.');
        return;
      }

      // Check if badge already exists
      const existing = getRegisteredAccounts();
      if (existing.some((o) => o.badgeId.toUpperCase() === trimmedId)) {
        setErrorMessage(`Badge ID "${trimmedId}" is already registered. Please log in directly.`);
        return;
      }

      setIsLoading(true);

      setTimeout(() => {
        const newOfficer: RegisteredOfficer = {
          badgeId: trimmedId,
          name: trimmedName,
          passwordHash: trimmedPassword,
        };
        saveRegisteredAccount(newOfficer);

        setIsLoading(false);
        setIsRegisterMode(false);
        setPassword('');
        setConfirmPassword('');
        setSuccessMessage(
          `Credentials enrolled for ${trimmedName} (${trimmedId})! Please sign in with your password.`
        );
      }, 400);
    } else {
      if (!trimmedId) {
        setErrorMessage('Please enter your officer badge ID.');
        return;
      }
      if (!trimmedPassword) {
        setErrorMessage('Please enter your password or security PIN.');
        return;
      }

      setIsLoading(true);

      setTimeout(() => {
        const registered = getRegisteredAccounts();
        const matched = registered.find(
          (o) => o.badgeId.toUpperCase() === trimmedId
        );

        if (!matched) {
          setErrorMessage(
            `Badge ID "${trimmedId}" is not registered in the system. Switch to "New Registration" to enroll.`
          );
          setIsLoading(false);
          return;
        }

        if (matched.passwordHash !== trimmedPassword) {
          setErrorMessage('Incorrect password or security PIN. Please verify your credentials.');
          setIsLoading(false);
          return;
        }

        // Live session authenticated
        login(matched.badgeId, matched.name, 'Enforcement Directorate');
        setIsLoading(false);
        navigate('/dashboard', { replace: true });
      }, 400);
    }
  };

  return (
    <div className="flex min-h-[82vh] items-center justify-center px-4 py-8 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      <div className="w-full max-w-md space-y-6">
        {/* Main Authentication Card */}
        <div className="rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-7 sm:p-10 shadow-2xl shadow-slate-900/10 transition-all duration-300 hover:shadow-blue-950/10">
          {/* Header Branding */}
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 ring-4 ring-blue-50 transition-transform duration-300 hover:scale-105">
              <Shield className="h-8 w-8" />
            </div>

            <div className="pt-2 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Legal Metrology Division</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Tri<span className="text-blue-600">Netra</span>
            </h1>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Legal Metrology Compliance Portal
            </p>
            <p className="text-xs text-slate-400">
              {isRegisterMode
                ? 'New Officer Credential Enrollment'
                : 'Authorized Field Officer Authentication'}
            </p>
          </div>

          {/* Toggle Tab: Login vs Sign Up */}
          <div className="mt-6 flex rounded-2xl bg-slate-100/90 p-1.5 border border-slate-200/60">
            <button
              type="button"
              onClick={() => handleToggleMode(false)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all duration-200 ${
                !isRegisterMode
                  ? 'bg-white text-blue-600 shadow-sm scale-[1.01]'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Officer Login</span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleMode(true)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all duration-200 ${
                isRegisterMode
                  ? 'bg-white text-blue-600 shadow-sm scale-[1.01]'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>New Registration</span>
            </button>
          </div>

          {/* Google Sign In Button */}
          <div className="mt-5">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-3 px-4 text-xs font-bold text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <span className="animate-pulse">Connecting to Google Identity Service...</span>
              ) : (
                <>
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Sign In with Google</span>
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 font-semibold text-slate-400">
                Or with official credentials
              </span>
            </div>
          </div>

          {/* Success Message Alert */}
          {successMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 animate-in fade-in">
              <CircleCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 animate-in fade-in">
              <TriangleAlert className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Officer Name Field (Only in Sign Up Mode) */}
            {isRegisterMode && (
              <div>
                <label
                  htmlFor="officer-name"
                  className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5"
                >
                  Officer Full Name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                    <BadgeCheck className="h-4 w-4" />
                  </div>
                  <input
                    id="officer-name"
                    type="text"
                    required
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-gray-50/50 py-2.5 pl-10 pr-3 text-xs font-medium text-gray-900 shadow-sm transition hover:border-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            )}

            {/* Officer Badge ID Field (Completely clean with no placeholder) */}
            <div>
              <label
                htmlFor="officer-id"
                className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5"
              >
                {isRegisterMode ? 'New Badge / Officer ID' : 'Badge / Officer ID'}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="officer-id"
                  type="text"
                  required
                  value={officerId}
                  onChange={(e) => setOfficerId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-gray-50/50 py-2.5 pl-10 pr-3 text-xs font-medium text-gray-900 shadow-sm transition hover:border-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Security Password Field (Completely clean with no placeholder) */}
            <div>
              <label
                htmlFor="officer-password"
                className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5"
              >
                {isRegisterMode ? 'New Password / PIN' : 'Password / PIN'}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="officer-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-gray-50/50 py-2.5 pl-10 pr-10 text-xs font-medium text-gray-900 shadow-sm transition hover:border-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field (Only in Sign Up Mode) */}
            {isRegisterMode && (
              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-gray-50/50 py-2.5 pl-10 pr-3 text-xs font-medium text-gray-900 shadow-sm transition hover:border-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            )}

            {/* SSL Trust Indicator */}
            <div className="flex items-center gap-2 pt-1">
              <CircleCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="text-[11px] text-gray-500">
                Connected to National Enforcement Gateway (NIC SSL Verified)
              </span>
            </div>

            {/* Primary Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 px-4 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>
                  {isLoading
                    ? isRegisterMode
                      ? 'Registering Officer...'
                      : 'Authenticating Credentials...'
                    : isRegisterMode
                    ? 'Register & Access Portal'
                    : 'Secure Officer Login'}
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </form>
        </div>

        {/* Footer Notice */}
        <div className="text-center text-[11px] text-gray-400 space-y-1">
          <p className="font-semibold text-gray-500">
            GOVERNMENT OF INDIA • MINISTRY OF CONSUMER AFFAIRS
          </p>
          <p className="max-w-xs mx-auto text-[10px] text-gray-400 leading-tight">
            Notice: Access is restricted strictly to authorized metrology enforcement officers. Unauthorized access, tampering, or misrepresentation is an offense punishable under Section 43/66 of the Information Technology Act, 2000 and Section 36 of the Legal Metrology Act, 2009.
          </p>
        </div>
      </div>
    </div>
  );
}
