import { useState, useRef, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  User,
  UserPlus,
  ArrowRight,
  CircleCheck,
  Eye,
  EyeOff,
  Sparkles,
  TriangleAlert,
  LogIn,
  MapPin,
  Briefcase,
} from 'lucide-react';
import { useTriNetra, type UserRole } from '../context/TriNetraContext';
import { INDIAN_STATES, type IndianStateType } from '../constants/indianStates';
import { DEFAULT_USERS, type RegisteredOfficer } from '../constants/seedUsers';

// Export REGIONS for backward compatibility across existing views
export const REGIONS = INDIAN_STATES;
export type RegionType = IndianStateType;
export type { RegisteredOfficer };

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useTriNetra();
  const isSubmittingRef = useRef(false);

  // Form input fields
  const [officerName, setOfficerName] = useState('');
  const [officerId, setOfficerId] = useState('');
  const [role, setRole] = useState<UserRole>('Field Officer');
  const [region, setRegion] = useState<string>('Gujarat');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);



  // Safe helper to read registered officers from localStorage ('users' array)
  const getRegisteredAccounts = (): RegisteredOfficer[] => {
    try {
      const storedUsers = localStorage.getItem('users');
      if (storedUsers) {
        const parsed = JSON.parse(storedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      const storedLegacy = localStorage.getItem('trinetra_registered_officers');
      if (storedLegacy) {
        const parsed = JSON.parse(storedLegacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse registered users from localStorage:', e);
    }
    // Seed default users if none found
    try {
      localStorage.setItem('users', JSON.stringify(DEFAULT_USERS));
      localStorage.setItem('trinetra_registered_officers', JSON.stringify(DEFAULT_USERS));
    } catch {}
    return DEFAULT_USERS;
  };

  // Safe helper to persist account into localStorage with try-catch quota guard
  const persistOfficerAccount = (
    newOfficer: RegisteredOfficer
  ): { success: boolean; error?: string } => {
    try {
      const current = getRegisteredAccounts();
      const updated = [
        ...current.filter((o) => String(o?.badgeId || '').toUpperCase() !== String(newOfficer.badgeId || '').toUpperCase()),
        newOfficer,
      ];
      localStorage.setItem('users', JSON.stringify(updated));
      localStorage.setItem('trinetra_registered_officers', JSON.stringify(updated));
      return { success: true };
    } catch (e) {
      console.error('LocalStorage write failure:', e);
      return {
        success: false,
        error:
          'Unable to write to local storage. Your browser storage quota may be exceeded or private browsing restrictions may be enabled.',
      };
    }
  };

  // Google SSO Simulation
  const handleGoogleSignup = () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsGoogleLoading(true);
    isSubmittingRef.current = true;

    setTimeout(() => {
      try {
        const googleOfficer: RegisteredOfficer = {
          badgeId: 'GOOG-8821',
          name: 'Google Verified Officer',
          passwordHash: 'google_sso_token',
          role: role,
          region: region || 'Gujarat',
        };

        const result = persistOfficerAccount(googleOfficer);
        if (!result.success) {
          setErrorMessage(result.error || 'Failed to persist Google SSO credentials.');
          setIsGoogleLoading(false);
          isSubmittingRef.current = false;
          return;
        }

        try {
          login(googleOfficer.badgeId, googleOfficer.name, googleOfficer.region, googleOfficer.role);
        } catch (ctxErr) {
          console.warn('Context login warning:', ctxErr);
        }

        setSuccessMessage('SSO Authentication verified! Launching terminal...');
        setIsGoogleLoading(false);

        setTimeout(() => {
          navigate('/dashboard', {
            replace: true,
            state: { registeredBadge: googleOfficer.badgeId, officerName: googleOfficer.name },
          });
        }, 300);
      } catch (err) {
        console.error('Google SSO unexpected error:', err);
        setErrorMessage('Failed to complete Single Sign-On registration. Please use the standard registration form.');
        setIsGoogleLoading(false);
        isSubmittingRef.current = false;
      }
    }, 600);
  };

  // Main Form Submission Handler
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedName = officerName.trim();
    const trimmedId = officerId.trim().toUpperCase();
    const trimmedRegion = region.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    // 1. Rigorous Form Validations
    if (!trimmedName) {
      setErrorMessage('Please enter your full official name.');
      return;
    }

    if (!trimmedId) {
      setErrorMessage('Please provide an Officer / Admin Badge ID (e.g., INSP-GJ-2041 or ADMIN-HQ-01).');
      return;
    }

    if (trimmedId.length < 3) {
      setErrorMessage('Badge ID must be at least 3 characters long.');
      return;
    }

    if (!role) {
      setErrorMessage('Please select an authorized role (Admin or Field Officer).');
      return;
    }

    if (!trimmedRegion) {
      setErrorMessage('Please select an authorized operating State or Union Territory.');
      return;
    }

    if (!trimmedPassword) {
      setErrorMessage('Please create a secure password / PIN.');
      return;
    }

    if (trimmedPassword.length < 4) {
      setErrorMessage('Security password / PIN must be at least 4 characters long.');
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      setErrorMessage('Passwords do not match. Please re-enter your password to confirm.');
      return;
    }

    // 2. Duplicate Badge ID Verification
    try {
      const existingOfficers = getRegisteredAccounts();
      const duplicate = existingOfficers.find((o) => String(o?.badgeId || '').toUpperCase() === trimmedId);
      if (duplicate) {
        setErrorMessage(
          `Badge ID "${trimmedId}" is already enrolled in the Pan-India Metrology Grid. Please log in directly or specify a unique ID.`
        );
        return;
      }
    } catch (checkErr) {
      console.warn('Warning during duplicate badge verification:', checkErr);
    }

    setIsLoading(true);
    isSubmittingRef.current = true;

    // 3. Persist and Navigate to Login Safely
    setTimeout(() => {
      try {
        const newOfficer: RegisteredOfficer = {
          badgeId: trimmedId,
          name: trimmedName,
          passwordHash: trimmedPassword,
          role: role,
          region: trimmedRegion,
        };

        const result = persistOfficerAccount(newOfficer);
        if (!result.success) {
          setErrorMessage(result.error || 'Failed to save officer credentials to local storage.');
          setIsLoading(false);
          isSubmittingRef.current = false;
          return;
        }

        setSuccessMessage(
          `National profile for ${trimmedName} (${trimmedId} • ${role} • ${trimmedRegion}) enrolled successfully! Redirecting to login...`
        );

        // Navigate cleanly to Login with state
        setTimeout(() => {
          setIsLoading(false);
          navigate('/login', {
            replace: true,
            state: {
              registeredBadge: trimmedId,
              message: `Credentials enrolled for ${trimmedName} (${trimmedId}) as ${role} [${trimmedRegion}]! Please sign in.`,
            },
          });
        }, 500);
      } catch (err) {
        console.error('Unhandled registration error:', err);
        setErrorMessage('An unexpected error occurred while finalizing enrollment. Please try again.');
        setIsLoading(false);
        isSubmittingRef.current = false;
      }
    }, 400);
  };

  return (
    <div className="flex min-h-[82vh] items-center justify-center px-4 py-8 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      <div className="w-full max-w-md space-y-6">
        {/* Main Enrollment Container Card */}
        <div className="rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-7 sm:p-10 shadow-2xl shadow-slate-900/10 transition-all duration-300 hover:shadow-blue-950/10">
          {/* Header Branding */}
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 ring-4 ring-blue-50 transition-transform duration-300 hover:scale-105">
              <Shield className="h-8 w-8" />
            </div>

            <div className="pt-2 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Legal Metrology Division • Govt of India</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Tri<span className="text-blue-600">Netra</span>
            </h1>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pan-India User Registration & Jurisdictional Enrollment
            </p>
            <p className="text-xs text-slate-400">
              Authorized State & UT regulatory portal for statutory weights and packaging audits
            </p>
          </div>

          {/* Mode Navigation Switcher: Switch between Login & Signup */}
          <div className="mt-6 flex rounded-2xl bg-slate-100/90 p-1.5 border border-slate-200/60">
            <Link
              to="/login"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all"
            >
              <LogIn className="h-3.5 w-3.5 text-slate-500" />
              <span>User Login</span>
            </Link>
            <div className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white py-2 text-xs font-bold text-blue-600 shadow-xs border border-slate-200/80">
              <UserPlus className="h-3.5 w-3.5 text-blue-600" />
              <span>New Registration</span>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-800 animate-in fade-in">
              <TriangleAlert className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="leading-snug font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs text-emerald-800 animate-in fade-in">
              <CircleCheck className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <div className="leading-snug font-medium">{successMessage}</div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="signup-name" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Official Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="signup-name"
                  type="text"
                  required
                  value={officerName}
                  onChange={(e) => {
                    setOfficerName(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="e.g., Rajesh Varma"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-4 text-xs font-semibold text-slate-900 shadow-xs transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Badge ID */}
            <div>
              <label htmlFor="signup-badge" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Badge / Employee ID <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Shield className="h-4 w-4" />
                </div>
                <input
                  id="signup-badge"
                  type="text"
                  required
                  value={officerId}
                  onChange={(e) => {
                    setOfficerId(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="e.g., INSP-GJ-2041 or ADMIN-HQ-01"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-4 text-xs font-semibold uppercase text-slate-900 shadow-xs transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Role & Pan-India State / UT Dropdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Role Dropdown */}
              <div>
                <label htmlFor="signup-role" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Role <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <select
                    id="signup-role"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-9 pr-3 text-xs font-semibold text-slate-900 shadow-xs transition hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="Field Officer">Field Officer</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* Pan-India State / UT Dropdown (28 States + 8 UTs Alphabetized) */}
              <div>
                <label htmlFor="signup-region" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  State / UT <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <select
                    id="signup-region"
                    required
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-9 pr-3 text-xs font-semibold text-slate-900 shadow-xs transition hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="" disabled>Select State / Union Territory</option>
                    {INDIAN_STATES.map((stateName) => (
                      <option key={stateName} value={stateName}>
                        {stateName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="signup-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Security Password / PIN <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Minimum 4 characters"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-10 text-xs font-semibold text-slate-900 shadow-xs transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="signup-confirm" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Confirm Password / PIN <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="signup-confirm"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Re-enter security password"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-4 text-xs font-semibold text-slate-900 shadow-xs transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="group mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/35 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Enrolling Pan-India Profile...</span>
                </>
              ) : (
                <>
                  <span>Enroll Profile & Continue</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Or Instant Enrollment
              </span>
            </div>
          </div>

          {/* Google SSO Button */}
          <button
            type="button"
            disabled={isLoading || isGoogleLoading}
            onClick={handleGoogleSignup}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-3 px-4 text-xs font-bold text-slate-700 shadow-xs transition-all duration-300 hover:bg-slate-50 hover:border-slate-300 hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                <span>Simulating Google SSO...</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Enroll with Google Workspace</span>
              </>
            )}
          </button>

          {/* Footer Note */}
          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-500">
              Already have an enrolled account?{' '}
              <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 underline">
                Sign In here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
