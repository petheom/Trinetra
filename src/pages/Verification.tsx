import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CircleCheck,
  CircleX,
  TriangleAlert,
  Languages,
  FileText,
  Scale,
  ChevronRight,
  ShieldCheck,
  Camera,
  Sparkles,
  Info,
  UserCheck,
} from 'lucide-react';
import { useTriNetra } from '../context/TriNetraContext';

type Verdict = 'compliant' | 'non-compliant' | null;

interface StatutoryRuleItem {
  id: string;
  ruleNo: string;
  label: string;
  extractedValue: string;
  status: 'found' | 'warning' | 'missing';
  statusLabel: string;
  explanation: string;
}

export default function Verification() {
  const location = useLocation();
  const navigate = useNavigate();
  const { officer, addReport } = useTriNetra();

  // State forwarded from previous scanner step if available
  const scannerState = location.state as {
    imageUrl?: string;
    category?: string;
    quality?: string;
  } | null;

  const [verdict, setVerdict] = useState<Verdict>(null);
  const [officerNotes, setOfficerNotes] = useState<string>('');

  // Mandatory statutory checklist under Legal Metrology (Packaged Commodities) Rules, 2011
  const rulesList: StatutoryRuleItem[] = [
    {
      id: 'mrp',
      ruleNo: 'Rule 6(1)(e)',
      label: 'Maximum Retail Price (MRP)',
      extractedValue: '₹120.00 (Incl. of all taxes) / ₹१२०.०० (सभी कर सहित)',
      status: 'found',
      statusLabel: 'Compliant & Visible',
      explanation: 'Includes statutory tax phrasing and standard rupee currency symbol.',
    },
    {
      id: 'net_qty',
      ruleNo: 'Rule 6(1)(c)',
      label: 'Net Quantity Declaration',
      extractedValue: 'Net Wt / शुद्ध वजन : 500 g',
      status: 'found',
      statusLabel: 'Standard Unit Verified',
      explanation: 'Expresses weight in metric units conforming to Seventh Schedule specifications.',
    },
    {
      id: 'mfg_date',
      ruleNo: 'Rule 6(1)(d)',
      label: 'Month & Year of Manufacture / Expiry',
      extractedValue: '[Indecipherable / Smudged Dot-Matrix Stamp]',
      status: 'warning',
      statusLabel: 'Missing or Incomplete',
      explanation: 'Mandatory declaration could not be verified with confidence (>90% threshold).',
    },
    {
      id: 'consumer_care',
      ruleNo: 'Rule 6(1)(a) & (g)',
      label: 'Manufacturer Address & Consumer Helpline',
      extractedValue: 'TriNetra Agri Foods Ltd, New Delhi-110020 | 1800-11-4000',
      status: 'found',
      statusLabel: 'Verified Registration',
      explanation: 'Contains complete registered postal address, email, and toll-free helpline number.',
    },
  ];

  const handleGenerateReport = () => {
    if (!verdict) return;

    try {
      // Dynamically record report in global context
      const createdReport = addReport({
        productName: 'Sample Inspected Package Feed',
        brand: 'TriNetra Foods India Ltd',
        category: scannerState?.category || 'Food & Beverages',
        location: `${officer?.region || 'Ahmedabad Zone'}, Field Unit`,
        verdict: verdict === 'compliant' ? 'Compliant' : 'Non-Compliant',
        violations:
          verdict === 'non-compliant'
            ? [
                'Rule 6(1)(d) - Omission of legible Month & Year of Manufacture/Expiry',
                'Section 36 - Notice issued for non-conforming packaging declarations',
              ]
            : undefined,
        findings:
          officerNotes ||
          'Automated statutory OCR validation confirmed against Legal Metrology Rules, 2011.',
        ocrConfidence: scannerState?.quality === 'warning' ? '82.0%' : '94.2%',
        imageUrl: scannerState?.imageUrl || null,
      });

      navigate('/reports', {
        state: {
          newReportId: createdReport?.id,
        },
      });
    } catch (err) {
      console.error('Failed to generate report:', err);
      navigate('/reports');
    }
  };

  return (
    <div className="w-full space-y-6 pb-6">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
            <Scale className="h-3.5 w-3.5" />
            <span>Legal Metrology (Packaged Commodities) Rules, 2011</span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            Compliance Verification
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Inspecting Officer: <strong className="text-gray-800">{officer?.name || 'Rajesh Varma'}</strong> ({officer?.badgeId || 'INSP-GJ-2041'})
          </p>
        </div>

        {scannerState?.category && (
          <div className="self-start rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-600 shadow-sm sm:self-auto">
            Commodity Class: <span className="font-semibold text-gray-900">{scannerState.category}</span>
          </div>
        )}
      </div>

      {/* 2. AI Preliminary Status Banner */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <TriangleAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  AI Preliminary Assessment
                </span>
                <span className="rounded-full bg-amber-200/70 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                  Confidence: 74%
                </span>
              </div>
              <h2 className="mt-0.5 text-base font-bold text-amber-950 sm:text-lg">
                Status: Manual Review Required (Missing Mandatory Date)
              </h2>
              <p className="mt-1 text-xs text-amber-800">
                Rule 6(1)(d) violation risk identified. The manufacturing or packaging date imprint is obscured or omitted from the inspected panel.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-end rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm sm:self-center">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>AI Flagged</span>
          </div>
        </div>
      </div>

      {/* 3. Responsive Split: Section A (OCR) & Section B (Rules Checklist) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* SECTION A: Visual Feed & Multilingual OCR Results (5 cols) */}
        <div className="space-y-5 lg:col-span-5">
          {/* Image Visualizer */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-600">
                <Camera className="h-4 w-4 text-blue-600" />
                <span>Inspection Artifact</span>
              </h3>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                Live Evidence
              </span>
            </div>

            <div className="mt-3 flex min-h-[220px] max-h-[280px] w-full items-center justify-center overflow-hidden rounded-xl bg-gray-900">
              {scannerState?.imageUrl ? (
                <img
                  src={scannerState.imageUrl}
                  alt="Scanned evidence"
                  className="max-h-[260px] w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-gray-400">
                  <FileText className="h-10 w-10 text-gray-500 mb-2" />
                  <span className="text-xs font-medium">Standard Packaging Panel Feed</span>
                  <span className="text-[11px] text-gray-500">Live OCR active</span>
                </div>
              )}
            </div>
          </div>

          {/* Multilingual Extracted Text Box */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Extracted Text (Multilingual OCR)
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
                EN + HI (Devanagari)
              </span>
            </div>

            <div className="mt-4 space-y-3 rounded-xl bg-gray-50 p-4 font-mono text-xs text-gray-800">
              <div className="border-b border-gray-200/60 pb-2">
                <span className="text-gray-400 block text-[10px]">RAW LINE 01</span>
                <p className="font-semibold text-gray-900">
                  Net Wt / शुद्ध वजन : <span className="text-blue-700">500g</span>
                </p>
              </div>

              <div className="border-b border-gray-200/60 pb-2">
                <span className="text-gray-400 block text-[10px]">RAW LINE 02</span>
                <p className="font-semibold text-gray-900">
                  MRP / एम.आर.पी : <span className="text-blue-700">₹120.00</span> (Inclusive of all taxes / सभी कर सहित)
                </p>
              </div>

              <div className="border-b border-gray-200/60 pb-2">
                <span className="text-gray-400 block text-[10px]">RAW LINE 03</span>
                <p className="font-semibold text-gray-900">
                  Batch No. / घान संख्या : <span className="text-gray-700">TR-2026-SEP</span>
                </p>
              </div>

              <div className="border-b border-gray-200/60 pb-2">
                <span className="text-gray-400 block text-[10px]">RAW LINE 04 [AMBIGUOUS]</span>
                <p className="text-amber-800 font-semibold bg-amber-100/50 p-1 rounded">
                  Mfg Dt: **/**/202* [UNRESOLVED - OCR CONFIDENCE 28%]
                </p>
              </div>

              <div>
                <span className="text-gray-400 block text-[10px]">RAW LINE 05</span>
                <p className="text-gray-700">
                  Mfg by: TriNetra Foods Ltd, New Delhi - 110020. Customer Care: 1800-11-4000
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION B: Statutory Rules Checklist (7 cols) */}
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Mandatory Statutory Declarations Audit
                </h3>
                <p className="text-xs text-gray-500">
                  Verified against Section 18 of the Legal Metrology Act, 2009
                </p>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                4 Rules Evaluated
              </span>
            </div>

            {/* Checklist Items */}
            <div className="mt-4 divide-y divide-gray-100">
              {rulesList.map((item) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                          {item.ruleNo}
                        </span>
                        <h4 className="text-sm font-bold text-gray-900">{item.label}</h4>
                      </div>

                      <div className="rounded-md bg-gray-50 px-3 py-2 text-xs font-medium text-gray-800">
                        <span className="text-gray-400 text-[10px] uppercase block">Extracted Content:</span>
                        {item.extractedValue}
                      </div>

                      <p className="text-xs text-gray-500 pt-0.5">{item.explanation}</p>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0 pt-0.5">
                      {item.status === 'found' ? (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          <CircleCheck className="h-4 w-4 text-emerald-600" />
                          <span className="hidden sm:inline">{item.statusLabel}</span>
                          <span className="sm:hidden">Found</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
                          <TriangleAlert className="h-4 w-4 text-amber-600" />
                          <span className="hidden sm:inline">{item.statusLabel}</span>
                          <span className="sm:hidden">Alert</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Legal Notice */}
          <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/70 p-3.5 text-xs text-blue-900">
            <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
            <p>
              As per Rule 6(1)(d), omitting or rendering unreadable the month and year of manufacture or expiry invites penal proceedings under Section 36 of the Legal Metrology Act.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Human-in-the-Loop (Final Officer Verdict Panel) */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Officer Final Verdict (Human-in-the-Loop)
            </h3>
            <p className="text-xs text-gray-500">
              The AI system recommends manual validation. Confirm or override compliance status as the inspecting officer.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {/* Verdict Selection Buttons */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setVerdict('compliant')}
              className={`flex items-center justify-center gap-3 rounded-2xl border-2 p-5 font-bold transition-all duration-200 ${
                verdict === 'compliant'
                  ? 'border-emerald-600 bg-emerald-50/90 text-emerald-900 shadow-lg shadow-emerald-600/15 ring-4 ring-emerald-500/20 scale-[1.02]'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:bg-emerald-50/40 hover:scale-[1.01] active:scale-95'
              }`}
            >
              <CircleCheck className={`h-6 w-6 ${verdict === 'compliant' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div className="text-left">
                <span className="block text-base">Mark as Compliant</span>
                <span className="block text-xs font-normal text-slate-500">All mandatory rules satisfied</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setVerdict('non-compliant')}
              className={`flex items-center justify-center gap-3 rounded-2xl border-2 p-5 font-bold transition-all duration-200 ${
                verdict === 'non-compliant'
                  ? 'border-rose-600 bg-rose-50/90 text-rose-900 shadow-lg shadow-rose-600/15 ring-4 ring-rose-500/20 scale-[1.02]'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-rose-400 hover:bg-rose-50/40 hover:scale-[1.01] active:scale-95'
              }`}
            >
              <CircleX className={`h-6 w-6 ${verdict === 'non-compliant' ? 'text-rose-600' : 'text-slate-400'}`} />
              <div className="text-left">
                <span className="block text-base">Mark as Non-Compliant</span>
                <span className="block text-xs font-normal text-slate-500">Issue notice / statutory violation</span>
              </div>
            </button>
          </div>

          {/* Optional Officer Remark */}
          <div className="pt-2">
            <label htmlFor="officer-notes" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Officer Inspection Remarks (Optional)
            </label>
            <input
              id="officer-notes"
              type="text"
              value={officerNotes}
              onChange={(e) => setOfficerNotes(e.target.value)}
              placeholder="e.g., Physical date stamp smudged on corner seal; recommended for secondary sample audit."
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 px-4 text-xs font-medium text-slate-900 shadow-sm transition hover:border-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* 5. Next Step Action */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-3xl border border-slate-200/90 bg-slate-50/80 p-5 transition-all sm:flex-row">
          <div className="flex items-center gap-3 text-xs text-slate-700">
            {verdict ? (
              <>
                <ShieldCheck className="h-6 w-6 text-blue-600 shrink-0" />
                <span>
                  Verdict recorded as{' '}
                  <strong className="uppercase font-extrabold text-slate-900">
                    {verdict === 'compliant' ? 'Compliant' : 'Non-Compliant'}
                  </strong>
                  . Ready to log into the evidence ledger.
                </span>
              </>
            ) : (
              <>
                <Info className="h-6 w-6 text-amber-600 shrink-0" />
                <span className="text-slate-600">
                  Please select either <strong className="text-slate-800">"Mark as Compliant"</strong> or{' '}
                  <strong className="text-slate-800">"Mark as Non-Compliant"</strong> above to finalize your docket.
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            disabled={!verdict}
            onClick={handleGenerateReport}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-xl shadow-blue-500/25 transition-all duration-200 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/35 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto shrink-0"
          >
            <span>Generate Evidence Report</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
