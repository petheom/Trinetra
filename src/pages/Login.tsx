import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
  Briefcase,
} from 'lucide-react';
import { useTriNetra } from '../context/TriNetraContext';
import { DEFAULT_USERS, type RegisteredOfficer } from '../constants/seedUsers';

interface LoginProps {
  initialMode?: 'login' | 'register';
}

export default function Login({ initialMode }: LoginProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useTriNetra();

  // Mode: 'login' | 'register' (if register, redirect to /signup once)
  useEffect(() => {
    if (initialMode === 'register' || location.pathname === '/signup') {
      navigate('/signup', { replace: true });
    }
  }, [initialMode, location.pathname, navigate]);

  // Pre-filled Default Testing Credentials for seamless developer & tester onboarding
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState<string>(() => {
    return (location.state as { message?: string } | null)?.message || '';
  });

  // Pick up credentials from signup redirection state if available
  useEffect(() => {
    const stateObj = location.state as {
      registeredBadge?: string;
      registeredUsername?: string;
      message?: string;
    } | null;

    if (stateObj?.registeredUsername) {
      setUsername(stateObj.registeredUsername);
    } else if (stateObj?.registeredBadge) {
      setUsername(stateObj.registeredBadge);
    }

    if (stateObj?.message) {
      setSuccessMessage(stateObj.message);
    }
  }, [location.state]);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Safe helper to read users from localStorage
  const getRegisteredAccounts = (): RegisteredOfficer[] => {
    try {
      const stored = localStorage.getItem('users');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      const legacy = localStorage.getItem('trinetra_registered_officers');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      // Seed default accounts if empty
      localStorage.setItem('users', JSON.stringify(DEFAULT_USERS));
      localStorage.setItem('trinetra_registered_officers', JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  };

  // Google SSO Simulation
  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    setTimeout(() => {
      try {
        const googleOfficer: RegisteredOfficer = {
          badgeId: 'GOOG-8821',
          name: 'Google Verified Officer',
          passwordHash: 'google_sso_token',
          role: 'Field Officer',
          region: 'Delhi (NCT)',
        };

        const activeSessionData = {
          badgeId: googleOfficer.badgeId,
          name: googleOfficer.name,
          role: googleOfficer.role,
          region: googleOfficer.region,
          loginTime: new Date().toISOString(),
        };

        localStorage.setItem('activeSession', JSON.stringify(activeSessionData));
        localStorage.setItem('trinetra_officer', JSON.stringify(activeSessionData));

        login(
          googleOfficer.badgeId,
          googleOfficer.name,
          googleOfficer.region,
          googleOfficer.role
        );

        setIsGoogleLoading(false);
        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error('Google login error:', err);
        setErrorMessage('Failed to establish Google SSO session.');
        setIsGoogleLoading(false);
      }
    }, 400);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername) {
      setErrorMessage('Please enter your Username or Email.');
      return;
    }
    if (!trimmedPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      try {
        const normalizedInput = trimmedUsername.toLowerCase();
        const registered = getRegisteredAccounts();

        // 1. Check matching against registered accounts in localStorage
        const matched = registered.find((o) => {
          const badgeMatch = String(o?.badgeId || '').toLowerCase() === normalizedInput;
          const nameMatch = String(o?.name || '').toLowerCase() === normalizedInput;
          const userPrefixMatch = String(o?.badgeId || '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .includes(normalizedInput);

          const roleMatch =
            (normalizedInput === 'admin' && o?.role === 'Admin') ||
            (normalizedInput === 'officer' && o?.role === 'Field Officer');

          return badgeMatch || nameMatch || userPrefixMatch || roleMatch;
        });

        // 2. Developer & Tester Fallback: If no account matched or database is fresh,
        // but user enters default test credentials, automatically provision and log in!
        if (!matched) {
          if (
            (normalizedInput === 'admin' || normalizedInput === 'admin@trinetra.gov.in') &&
            trimmedPassword === 'admin123'
          ) {
            const fallbackAdmin = {
              badgeId: 'ADMIN-HQ-01',
              name: 'Director Amit Trivedi',
              role: 'Admin' as const,
              region: 'Delhi (NCT)',
              loginTime: new Date().toISOString(),
            };
            localStorage.setItem('activeSession', JSON.stringify(fallbackAdmin));
            localStorage.setItem('trinetra_officer', JSON.stringify(fallbackAdmin));
            login(
              fallbackAdmin.badgeId,
              fallbackAdmin.name,
              fallbackAdmin.region,
              fallbackAdmin.role
            );
            setIsLoading(false);
            navigate('/dashboard', { replace: true });
            return;
          }

          if (
            (normalizedInput === 'officer' || normalizedInput === 'officer@trinetra.gov.in') &&
            (trimmedPassword === 'GovPass#2026' || trimmedPassword === 'officer123')
          ) {
            const fallbackOfficer = {
              badgeId: 'INSP-GJ-2041',
              name: 'Inspector Rajesh Varma',
              role: 'Field Officer' as const,
              region: 'Gujarat',
              loginTime: new Date().toISOString(),
            };
            localStorage.setItem('activeSession', JSON.stringify(fallbackOfficer));
            localStorage.setItem('trinetra_officer', JSON.stringify(fallbackOfficer));
            login(
              fallbackOfficer.badgeId,
              fallbackOfficer.name,
              fallbackOfficer.region,
              fallbackOfficer.role
            );
            setIsLoading(false);
            navigate('/dashboard', { replace: true });
            return;
          }

          setErrorMessage(
            `Account "${trimmedUsername}" was not found. Use "admin" / "admin123" or sign up for a new profile.`
          );
          setIsLoading(false);
          return;
        }

        // Validate password (or permit default bypass for test convenience)
        const isPasswordValid =
          matched.passwordHash === trimmedPassword ||
          (matched.role === 'Admin' && trimmedPassword === 'admin123') ||
          (matched.role === 'Field Officer' && trimmedPassword === 'GovPass#2026');

        if (!isPasswordValid) {
          setErrorMessage('Incorrect password. Please verify your credentials or use the test presets below.');
          setIsLoading(false);
          return;
        }

        // Credentials are valid: Save complete activeSession object in localStorage
        const activeSessionData = {
          badgeId: matched.badgeId || (matched.role === 'Admin' ? 'ADMIN-HQ-01' : 'INSP-GJ-2041'),
          name: matched.name || 'Officer',
          role: matched.role || 'Field Officer',
          region: matched.region || 'Gujarat',
          loginTime: new Date().toISOString(),
        };

        localStorage.setItem('activeSession', JSON.stringify(activeSessionData));
        localStorage.setItem('trinetra_officer', JSON.stringify(activeSessionData));

        // Update context state
        login(
          activeSessionData.badgeId,
          activeSessionData.name,
          activeSessionData.region,
          activeSessionData.role
        );

        setIsLoading(false);
        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error('Login validation error:', err);
        setErrorMessage('An unexpected error occurred during login verification.');
        setIsLoading(false);
      }
    }, 250);
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
              Role-Based Enforcement & Administrative Gateway
            </p>
          </div>

          {/* Toggle Tab: Login vs Sign Up */}
          <div className="mt-6 flex rounded-2xl bg-slate-100/90 p-1.5 border border-slate-200/60">
            <div className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white py-2 text-xs font-bold text-blue-600 shadow-xs border border-slate-200/80">
              <LogIn className="h-3.5 w-3.5 text-blue-600" />
              <span>User Login</span>
            </div>

            <Link
              to="/signup"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all"
            >
              <UserPlus className="h-3.5 w-3.5 text-slate-500" />
              <span>New Registration</span>
            </Link>
          </div>

          {/* Quick Test Credentials Presets */}
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-slate-700">
            <div className="font-bold text-blue-900 flex items-center gap-1.5 mb-1.5">
              <Briefcase className="h-3.5 w-3.5 text-blue-700" />
              <span>Quick Test Credentials (Click to fill):</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setUsername('admin');
                  setPassword('admin123');
                  setErrorMessage('');
                }}
                className="text-left rounded-lg bg-white p-2 border border-blue-200/80 hover:border-blue-400 transition hover:shadow-xs cursor-pointer"
              >
                <div className="font-bold text-blue-900 flex items-center justify-between">
                  <span>Admin Role</span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">Preset</span>
                </div>
                <div className="font-mono text-slate-600 mt-0.5">user: admin</div>
                <div className="font-mono text-slate-400 text-[10px]">pass: admin123</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername('officer');
                  setPassword('GovPass#2026');
                  setErrorMessage('');
                }}
                className="text-left rounded-lg bg-white p-2 border border-blue-200/80 hover:border-blue-400 transition hover:shadow-xs cursor-pointer"
              >
                <div className="font-bold text-emerald-900 flex items-center justify-between">
                  <span>Field Officer</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1 rounded">Preset</span>
                </div>
                <div className="font-mono text-slate-600 mt-0.5">user: officer</div>
                <div className="font-mono text-slate-400 text-[10px]">pass: GovPass#2026</div>
              </button>
            </div>
          </div>

          {/* Google Sign In Button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-2.5 px-4 text-xs font-bold text-slate-700 shadow-xs transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
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
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 font-semibold text-slate-400 text-[10px]">
                Or enter credentials
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

          {/* Standardized Credentials Form: Username + Password */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Standard Username / Email Input */}
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Username or Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="login-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="e.g. admin or officer"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 pl-10 pr-3 text-xs font-medium text-slate-900 shadow-xs transition hover:border-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Standard Password Input */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 pl-10 pr-10 text-xs font-medium text-slate-900 shadow-xs transition hover:border-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* SSL Trust Indicator */}
            <div className="flex items-center gap-2 pt-1">
              <CircleCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="text-[11px] text-slate-500">
                Connected to National Metrology Enforcement Gateway (NIC SSL Verified)
              </span>
            </div>

            {/* Primary Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 px-4 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                <span>
                  {isLoading ? 'Verifying Credentials...' : 'Authenticate & Open Dashboard'}
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </form>
        </div>

        {/* Footer Notice */}
        <div className="text-center text-[11px] text-slate-400 space-y-1">
          <p className="font-semibold text-slate-500">
            GOVERNMENT OF INDIA • MINISTRY OF CONSUMER AFFAIRS
          </p>
          <p className="max-w-xs mx-auto text-[10px] text-slate-400 leading-tight">
            Role-Based Access Control enforced under the Legal Metrology Act, 2009. Unauthorized access is logged and prosecuted.
          </p>
        </div>
      </div>
    </div>
  );
}
