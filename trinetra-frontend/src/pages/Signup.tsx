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
import { authAPI } from '../utils/api';
import { INDIAN_STATES, type IndianStateType } from '../constants/indianStates';
// Export REGIONS for backward compatibility across existing views
export const REGIONS = INDIAN_STATES;
export type RegionType = IndianStateType;

export default function Signup() {
  const navigate = useNavigate();
  const { showToast } = useTriNetra();
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

  // Main Form Submission Handler
  const handleSubmit = async (e: FormEvent) => {
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
      setErrorMessage('Please provide a Username / Badge ID (e.g., om or dhoni).');
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

    if (trimmedPassword.length < 6) {
      setErrorMessage('Security password / PIN must be at least 6 characters long.');
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      setErrorMessage('Passwords do not match. Please re-enter your password to confirm.');
      return;
    }

    setIsLoading(true);
    isSubmittingRef.current = true;

    try {
      // 2. Submit to Node.js Backend API
      const response = await authAPI.register({
        name: trimmedName,
        badgeId: trimmedId,
        username: trimmedId,
        password: trimmedPassword,
        role: role === 'Admin' ? 'Admin' : 'Field Officer',
        region: trimmedRegion,
      });

      if (response && response.success) {
        showToast(
          `Profile for ${trimmedName} (${trimmedId}) enrolled successfully in National Metrology Database!`,
          'success'
        );

        setSuccessMessage(
          `National profile for ${trimmedName} (${trimmedId} • ${role} • ${trimmedRegion}) enrolled successfully! Redirecting to login...`
        );

        setTimeout(() => {
          setIsLoading(false);
          isSubmittingRef.current = false;
          navigate('/login', {
            replace: true,
            state: {
              registeredBadge: trimmedId,
              registeredRole: role,
              message: `Credentials enrolled for ${trimmedName} (${trimmedId}) as ${role} [${trimmedRegion}]! Please sign in.`,
            },
          });
        }, 600);
        return;
      }
      throw new Error(response?.message || 'Enrollment rejected by server.');
    } catch (apiErr: any) {
      console.warn('[Signup] API error during registration:', apiErr);

      // Extract exact server validation error message
      const serverMessage =
        apiErr?.response?.data?.message ||
        apiErr?.data?.message ||
        apiErr?.message ||
        'Registration failed. Please check that the server is online and try again.';

      setErrorMessage(serverMessage);
      showToast(serverMessage, 'error');

      setIsLoading(false);
      isSubmittingRef.current = false;
    }
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
          <form onSubmit={handleSubmit} autoComplete="off" className="mt-6 space-y-4">
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
                  autoComplete="off"
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

            {/* Username / Badge ID */}
            <div>
              <label htmlFor="signup-badge" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Username / Badge ID <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Shield className="h-4 w-4" />
                </div>
                <input
                  id="signup-badge"
                  type="text"
                  required
                  autoComplete="off"
                  value={officerId}
                  onChange={(e) => {
                    setOfficerId(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="e.g., om or dhoni"
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
                  autoComplete="off"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Minimum 6 characters"
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
                  autoComplete="off"
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

            {/* Inline Error Banner immediately visible above Submit button */}
            {errorMessage && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/95 p-3.5 text-xs text-rose-800 animate-in fade-in">
                <TriangleAlert className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="leading-snug font-semibold">{errorMessage}</div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
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
