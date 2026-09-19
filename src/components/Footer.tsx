import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Eye,
  Scale,
  Lock,
  ChevronRight,
  X,
} from 'lucide-react';

export default function Footer() {
  const [modalContent, setModalContent] = useState<{ title: string; body: string } | null>(null);

  const openModal = (title: string, body: string) => {
    setModalContent({ title, body });
  };

  const closeModal = () => {
    setModalContent(null);
  };

  return (
    <>
      <footer className="relative mt-16 w-full border-t border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-400">
        {/* 1. National Tricolor Gradient Top Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
            {/* Column 1 & 2: Official Branding & Motto */}
            <div className="lg:col-span-2 space-y-4">
              {/* Logo & National Crest Badge */}
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-white/10">
                  <Eye className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-white tracking-tight">
                      Tri<span className="text-blue-400">Netra</span>
                    </span>
                    <span className="rounded-full bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      GOVT PORTAL
                    </span>
                  </div>
                  <span
                    className="block text-xs font-black tracking-widest text-amber-500 font-serif"
                    style={{ fontFamily: "'Noto Sans Devanagari', 'Inter', serif" }}
                  >
                    सत्यमेव जयते
                  </span>
                </div>
              </div>

              {/* Ministerial Details */}
              <div className="space-y-1 text-xs text-slate-400 leading-relaxed max-w-sm">
                <p className="font-bold text-slate-200">
                  उपभोक्ता मामले, खाद्य और सार्वजनिक वितरण मंत्रालय
                </p>
                <p className="font-semibold text-slate-300">
                  Ministry of Consumer Affairs, Food & Public Distribution
                </p>
                <p className="text-slate-400">
                  विधिक मापविज्ञान प्रभाग • Legal Metrology Division
                </p>
                <p className="pt-2 text-[11px] text-slate-400">
                  National automated surveillance infrastructure enforcing compliance under the{' '}
                  <strong className="text-slate-300 font-semibold">
                    Legal Metrology (Packaged Commodities) Rules, 2011
                  </strong>
                  .
                </p>
              </div>

              {/* Security & Cryptographic Seal */}
              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-xs text-slate-300 shadow-inner">
                <Lock className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[11px] font-semibold">
                  256-bit TLS • SHA-256 Court-Admissible Hash Ledger
                </span>
              </div>
            </div>

            {/* Column 3: Statutory & Regulatory */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Statutory Mandates
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link
                    to="/about"
                    className="hover:text-blue-400 transition-colors flex items-center gap-1.5"
                  >
                    <ChevronRight className="h-3 w-3 text-blue-500" />
                    <span>Legal Metrology Act, 2009</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    className="hover:text-blue-400 transition-colors flex items-center gap-1.5"
                  >
                    <ChevronRight className="h-3 w-3 text-blue-500" />
                    <span>Packaged Commodities Rules, 2011</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    className="hover:text-blue-400 transition-colors flex items-center gap-1.5"
                  >
                    <ChevronRight className="h-3 w-3 text-blue-500" />
                    <span>Rule 6 Mandatory Declarations</span>
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      openModal(
                        'Ministry Guidelines & SOP',
                        'Pursuant to Section 15 of the Legal Metrology Act, 2009, field enforcement officers must conduct optical package inspections under uniform lighting, extract bilingual declarations, and record evidence with cryptographic SHA-256 digests prior to serving statutory compounding notices under Section 48.'
                      )
                    }
                    className="hover:text-blue-400 transition-colors flex items-center gap-1.5 text-left"
                  >
                    <ChevronRight className="h-3 w-3 text-blue-500" />
                    <span>Ministry Guidelines</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Officer Terminal Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Officer Modules
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link
                    to="/dashboard"
                    className="hover:text-blue-400 transition-colors flex items-center gap-1.5"
                  >
                    <ChevronRight className="h-3 w-3 text-blue-500" />
                    <span>Inspection Command Center</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/scanner"
                    className="hover:text-blue-400 transition-colors flex items-center gap-1.5"
                  >
                    <ChevronRight className="h-3 w-3 text-blue-500" />
                    <span>Field Optical Quality Gate</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/verification"
                    className="hover:text-blue-400 transition-colors flex items-center gap-1.5"
                  >
                    <ChevronRight className="h-3 w-3 text-blue-500" />
                    <span>Statutory Rules Audit Engine</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/reports"
                    className="hover:text-blue-400 transition-colors flex items-center gap-1.5"
                  >
                    <ChevronRight className="h-3 w-3 text-blue-500" />
                    <span>Evidentiary Seizure Ledger</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 5: Legal & Helpdesk Support */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Support & Contact
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-blue-400 transition-colors flex items-center gap-1.5"
                  >
                    <ChevronRight className="h-3 w-3 text-blue-500" />
                    <span>Officer Support Helpdesk</span>
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      openModal(
                        'Government Data Privacy Policy',
                        'All packaging imagery, extracted OCR text, GPS jurisdictional coordinates, and officer identity credentials processed on the TriNetra Portal are classified under official government data standards. Audit trails are cryptographically signed with SHA-256 to ensure non-repudiation.'
                      )
                    }
                    className="hover:text-blue-400 transition-colors flex items-center gap-1.5 text-left"
                  >
                    <ChevronRight className="h-3 w-3 text-blue-500" />
                    <span>Privacy Policy & Data Security</span>
                  </button>
                </li>
                <li className="pt-2 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300 block">National Consumer Helpline:</span>
                  <span className="font-mono text-amber-400 font-bold">1800-11-4000</span> /{' '}
                  <span className="font-mono text-amber-400 font-bold">1915</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Accreditation Bar */}
          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p className="text-center sm:text-left">
              © 2026 TriNetra - Government of India Compliance Portal. All Rights Reserved.
            </p>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="text-[11px] font-medium">
                Smart India Hackathon Initiative • Ministry of Consumer Affairs
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive Modal for Official Guidelines & Privacy Policy */}
      {modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 sm:p-8 text-white shadow-2xl">
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-5 right-5 rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/40">
                <Scale className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">{modalContent.title}</h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              {modalContent.body}
            </p>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md transition hover:scale-105"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
