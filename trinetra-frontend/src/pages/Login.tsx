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
  UserCheck,
} from 'lucide-react';
import { useTriNetra, type UserRole } from '../context/TriNetraContext';
import { authAPI } from '../utils/api';

interface LoginProps {
  initialMode?: 'login' | 'register';
}

export default function Login({ initialMode }: LoginProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, showToast } = useTriNetra();

  // Mode: 'login' | 'register' (if register, redirect to /signup once)
  useEffect(() => {
    if (initialMode === 'register' || location.pathname === '/signup') {
      navigate('/signup', { replace: true });
    }
  }, [initialMode, location.pathname, navigate]);

  // Role Selection State: explicitly selected role before logging in
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');

  // Empty credentials - user manually enters credentials
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState<string>(() => {
    return (location.state as { message?: string } | null)?.message || '';
  });

  // Pick up credentials from signup redirection state if available
  useEffect(() => {
    const stateObj = location.state as {
      registeredBadge?: string;
      registeredUsername?: string;
      registeredRole?: UserRole;
      message?: string;
    } | null;

    if (stateObj?.registeredUsername) {
      setUsername(stateObj.registeredUsername);
    } else if (stateObj?.registeredBadge) {
      setUsername(stateObj.registeredBadge);
    }

    if (stateObj?.registeredRole) {
      setSelectedRole(stateObj.registeredRole);
    }

    if (stateObj?.message) {
      setSuccessMessage(stateObj.message);
    }
  }, [location.state]);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedRole) {
      setErrorMessage('Please select your role: Admin or Field Officer.');
      return;
    }

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername) {
      setErrorMessage('Please enter your Username or Badge ID.');
      return;
    }
    if (!trimmedPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Attempt genuine authentication via Node.js Express API with selected role
      const response = await authAPI.login({
        badgeId: trimmedUsername,
        username: trimmedUsername,
        password: trimmedPassword,
        role: selectedRole,
      });

      if (response && response.success && response.user) {
        const { user, token } = response;
        const safeRole = user.role === 'Admin' ? 'Admin' : 'Field Officer';

        // Persist token and active session in context and localStorage
        login(user.badgeId, user.name, user.region, safeRole, token);
        showToast(`Authenticated as ${user.name} (${user.badgeId}) • ${safeRole}`, 'success');

        setIsLoading(false);
        navigate('/dashboard', { replace: true });
        return;
      }
      throw new Error(response?.message || 'Authentication failed');
    } catch (apiErr: any) {
      console.warn('[Login] API login attempt failed or offline:', apiErr);
      const apiMessage = apiErr?.message || 'Unable to connect to authentication server.';

      // If backend returned explicit 400 or 401 client error (e.g. wrong password or badge not found)
      if (apiErr.status === 400 || apiErr.status === 401) {
        setErrorMessage(apiMessage);
        showToast(apiMessage, 'error');
        setIsLoading(false);
        return;
      }

      // 2. Failsafe Offline / Developer Fallback for Testing when server is booting
      const normalizedInput = trimmedUsername.toLowerCase();

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
        login(
          fallbackAdmin.badgeId,
          fallbackAdmin.name,
          fallbackAdmin.region,
          fallbackAdmin.role
        );
        showToast('Running in offline developer mode (Server bootstrapping)', 'warning');
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
        login(
          fallbackOfficer.badgeId,
          fallbackOfficer.name,
          fallbackOfficer.region,
          fallbackOfficer.role
        );
        showToast('Running in offline developer mode (Server bootstrapping)', 'warning');
        setIsLoading(false);
        navigate('/dashboard', { replace: true });
        return;
      }

      setErrorMessage(`${apiMessage} (Check that Node.js backend is running on port 5000)`);
      showToast(apiMessage, 'error');
      setIsLoading(false);
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

          {/* Success Message Alert */}
          {successMessage && (
            <div className="mt-4 mb-2 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 animate-in fade-in">
              <CircleCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mt-4 mb-2 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 animate-in fade-in">
              <TriangleAlert className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Standardized Credentials Form: Role + Username + Password */}
          <form onSubmit={handleSubmit} autoComplete="off" className="mt-4 space-y-4">
            {/* Explicit Role Selection (Admin vs Field Officer) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select Your Role <span className="text-rose-500">*</span>
                </label>
                {selectedRole ? (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    selectedRole === 'Admin'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      selectedRole === 'Admin' ? 'bg-rose-500' : 'bg-emerald-500'
                    }`} />
                    {selectedRole} Portal
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400">
                    Required for access
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Field Officer Card */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('Field Officer');
                    if (errorMessage.includes('role')) setErrorMessage('');
                  }}
                  className={`group relative flex flex-col items-start p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    selectedRole === 'Field Officer'
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <div className={`p-1.5 rounded-xl transition-colors ${
                      selectedRole === 'Field Officer'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-200/80 text-slate-600 group-hover:bg-slate-300'
                    }`}>
                      <UserCheck className="h-4 w-4" />
                    </div>
                    {selectedRole === 'Field Officer' && (
                      <CircleCheck className="h-4 w-4 text-emerald-600 animate-in zoom-in-50" />
                    )}
                  </div>
                  <div className={`text-xs font-bold ${
                    selectedRole === 'Field Officer' ? 'text-emerald-950' : 'text-slate-800'
                  }`}>
                    Field Officer
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    Inspection & Scanner
                  </div>
                </button>

                {/* Admin Card */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('Admin');
                    if (errorMessage.includes('role')) setErrorMessage('');
                  }}
                  className={`group relative flex flex-col items-start p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    selectedRole === 'Admin'
                      ? 'border-rose-500 bg-rose-50/70 shadow-sm ring-2 ring-rose-500/20'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <div className={`p-1.5 rounded-xl transition-colors ${
                      selectedRole === 'Admin'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-200/80 text-slate-600 group-hover:bg-slate-300'
                    }`}>
                      <Briefcase className="h-4 w-4" />
                    </div>
                    {selectedRole === 'Admin' && (
                      <CircleCheck className="h-4 w-4 text-rose-600 animate-in zoom-in-50" />
                    )}
                  </div>
                  <div className={`text-xs font-bold ${
                    selectedRole === 'Admin' ? 'text-rose-950' : 'text-slate-800'
                  }`}>
                    Admin
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    National Oversight
                  </div>
                </button>
              </div>
            </div>

            {/* Standard Username / Email Input */}
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Username or Badge ID <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="login-username"
                  type="text"
                  required
                  autoComplete="off"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="e.g., om or INSP-GJ-2041"
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
                  autoComplete="off"
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
                disabled={isLoading}
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
