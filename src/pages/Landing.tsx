import React from 'react';
import { Link } from 'react-router-dom';
import {
  Eye,
  QrCode,
  FileText,
  Sparkles,
  ArrowRight,
  Scale,
  CircleCheck,
  Languages,
  Activity,
  UserPlus,
  LogIn,
  Lock,
  Award,
} from 'lucide-react';
import { useTriNetra } from '../context/TriNetraContext';

export default function Landing() {
  const { officer } = useTriNetra();

  return (
    <div className="w-full space-y-12 sm:space-y-16 py-2 sm:py-4">
      {/* 1. Ultra-Luxury Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 px-6 py-14 sm:px-12 sm:py-20 text-white shadow-2xl shadow-blue-950/20">
        {/* Subtle Background Radial Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center space-y-6">
          {/* Official Emblem & National Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-bold text-amber-300 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-amber-400/50">
            <Award className="h-4 w-4 text-amber-400" />
            <span className="tracking-wider uppercase text-[11px]">
              विधिक मापविज्ञान अधिनियम, 2009 • LEGAL METROLOGY ACT, 2009
            </span>
          </div>

          {/* Main Title & Emblem */}
          <div className="flex items-center justify-center gap-3.5 pt-1">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-500 text-white shadow-xl shadow-blue-500/30 ring-4 ring-white/10 transition-transform duration-300 hover:scale-105">
              <Eye className="h-8 w-8" />
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white drop-shadow-sm">
              Tri<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Netra</span>
            </h1>
          </div>

          {/* Subtitle & Tagline */}
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-blue-200 tracking-tight">
              Automated Packaging Inspection & Statutory Rules Audit
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
              Next-generation optical intelligence platform enforcing statutory compliance under the{' '}
              <strong className="text-white font-semibold">
                Legal Metrology (Packaged Commodities) Rules, 2011
              </strong>
              . Instant Devanagari & Latin OCR, Rule 6 validation, and court-admissible SHA-256 evidence.
            </p>
          </div>

          {/* CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            {officer ? (
              <Link
                to="/dashboard"
                className="group flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-blue-600/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/40 active:scale-95"
              >
                <span>Access Terminal ({officer.name})</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="group flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-blue-600/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/40 active:scale-95"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Authorized Officer Login</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  to="/signup"
                  className="flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-8 py-4 text-sm font-bold text-white shadow-md transition-all duration-300 hover:bg-white/15 hover:border-white/30 hover:scale-[1.02] active:scale-95"
                >
                  <UserPlus className="h-4 w-4 text-blue-300" />
                  <span>Enroll New Badge ID</span>
                </Link>
              </>
            )}
          </div>

          {/* Trust Pillar Badges */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-300 font-medium">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5">
              <CircleCheck className="h-4 w-4 text-emerald-400" />
              Mandatory Rule 6 Statutory Engine
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5">
              <CircleCheck className="h-4 w-4 text-emerald-400" />
              Bilingual Devanagari & Latin OCR
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5">
              <CircleCheck className="h-4 w-4 text-emerald-400" />
              Cryptographic SHA-256 Ledger
            </span>
          </div>
        </div>
      </section>

      {/* 2. Key Capabilities (3D Hover Cards) */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600">
            Precision Field Automation
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Designed for National Enforcement Standards
          </h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Replacing slow manual caliper audits with edge optical recognition and statutory intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1 */}
          <div className="group rounded-3xl border border-slate-200/90 bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 hover:border-blue-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-5 transition-transform duration-300 group-hover:scale-110">
              <QrCode className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              Computer Vision Ingestion
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Field tablet camera capture with automated exposure, sharpness, and glare quality gates before passing images to statutory validation.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group rounded-3xl border border-slate-200/90 bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 hover:border-indigo-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-5 transition-transform duration-300 group-hover:scale-110">
              <Languages className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Bilingual Indic OCR
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Extracts bilingual packaging declarations in Hindi (शुद्ध वजन, एम.आर.पी) and English (Net Wt, MRP) with bounding-box coordinate tracking.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group rounded-3xl border border-slate-200/90 bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 hover:border-emerald-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-5 transition-transform duration-300 group-hover:scale-110">
              <Scale className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
              Rule 6 Statutory Audit
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Automated compliance verification for MRP, Net Quantity, Manufacturing Date, Importer/Manufacturer details, and Consumer Care contacts.
            </p>
          </div>

          {/* Card 4 */}
          <div className="group rounded-3xl border border-slate-200/90 bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 hover:border-purple-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 mb-5 transition-transform duration-300 group-hover:scale-110">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
              SHA-256 Evidentiary Dossier
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Generates court-admissible inspection dockets with cryptographic SHA-256 verification, seizure memos, and notice records under Section 36.
            </p>
          </div>

          {/* Card 5 */}
          <div className="group rounded-3xl border border-slate-200/90 bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1 hover:border-amber-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-5 transition-transform duration-300 group-hover:scale-110">
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
              Command Analytics
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Centralized dashboard monitoring regional compliance rates, category hot-spots, market trends, and Section 48 compounding fee collections.
            </p>
          </div>

          {/* Card 6 */}
          <div className="group rounded-3xl border border-slate-200/90 bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/10 hover:-translate-y-1 hover:border-rose-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-5 transition-transform duration-300 group-hover:scale-110">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
              Role-Based Officer SSO
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Protected authentication gateway with Officer Badge verification, Google Single Sign-On, and isolated jurisdictional audit trails.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Field Workflow Step-by-Step */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-12 shadow-md space-y-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Standard Operating Procedure (SOP)</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900">
            How TriNetra Operates in the Field
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group relative rounded-2xl border border-slate-200/80 bg-slate-50/70 p-6 transition-all duration-300 hover:bg-white hover:shadow-lg hover:border-blue-300 hover:-translate-y-1">
            <div className="text-3xl font-black text-blue-600 mb-2">01</div>
            <h4 className="text-sm font-bold text-slate-900">Capture Package Image</h4>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Officer photographs packaging surfaces via tablet camera under ambient field lighting.
            </p>
          </div>

          <div className="group relative rounded-2xl border border-slate-200/80 bg-slate-50/70 p-6 transition-all duration-300 hover:bg-white hover:shadow-lg hover:border-blue-300 hover:-translate-y-1">
            <div className="text-3xl font-black text-blue-600 mb-2">02</div>
            <h4 className="text-sm font-bold text-slate-900">AI Rules Engine Audit</h4>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Multilingual OCR extracts declarations and evaluates statutory rules under Legal Metrology 2011.
            </p>
          </div>

          <div className="group relative rounded-2xl border border-slate-200/80 bg-slate-50/70 p-6 transition-all duration-300 hover:bg-white hover:shadow-lg hover:border-blue-300 hover:-translate-y-1">
            <div className="text-3xl font-black text-blue-600 mb-2">03</div>
            <h4 className="text-sm font-bold text-slate-900">Officer Verification</h4>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Inspector conducts Human-in-the-Loop review, overrides edge cases, or records violations.
            </p>
          </div>

          <div className="group relative rounded-2xl border border-slate-200/80 bg-slate-50/70 p-6 transition-all duration-300 hover:bg-white hover:shadow-lg hover:border-blue-300 hover:-translate-y-1">
            <div className="text-3xl font-black text-blue-600 mb-2">04</div>
            <h4 className="text-sm font-bold text-slate-900">Evidentiary Docket</h4>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Immutable report generated with digital hash digest, ready for official notice or court filing.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Luxury Bottom Callout */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 px-8 py-12 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              Ready to conduct field compliance audits?
            </h3>
            <p className="text-sm text-slate-300 max-w-xl">
              Log in with your designated officer credentials or enroll a new badge profile to access the legal metrology workspace.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/login"
              className="rounded-xl bg-white px-6 py-3 text-xs font-bold text-slate-900 shadow-md transition-all duration-300 hover:bg-blue-50 hover:scale-105 active:scale-95"
            >
              Officer Portal
            </Link>
            <Link
              to="/signup"
              className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-md px-6 py-3 text-xs font-bold text-white transition-all duration-300 hover:bg-white/20 hover:scale-105 active:scale-95"
            >
              Enroll Badge ID
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Statutory Assurance Bar */}
      <div className="pt-2 text-center">
        <div className="inline-flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-md px-6 py-3 text-xs font-semibold text-slate-600 shadow-xs">
          <Scale className="h-4 w-4 text-blue-600" />
          <span>LEGAL METROLOGY ACT, 2009 & PACKAGED COMMODITIES RULES, 2011</span>
          <span className="hidden sm:inline-block text-slate-300">•</span>
          <span className="text-emerald-700 font-bold">Court-Admissible Verification Standard</span>
        </div>
      </div>
    </div>
  );
}
