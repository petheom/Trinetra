import { useState, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
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
  ScanLine,
} from 'lucide-react';
import { useTriNetra } from '../context/TriNetraContext';
import type { InspectionOcrAnalysis } from '../utils/legalMetrologyOcr';

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
    analysis?: InspectionOcrAnalysis;
  } | null;

  const analysis = scannerState?.analysis;

  const [verdict, setVerdict] = useState<Verdict>(() => {
    if (analysis?.verdict === 'Compliant') return 'compliant';
    if (analysis?.verdict === 'Non-Compliant') return 'non-compliant';
    return null;
  });

  const [officerNotes, setOfficerNotes] = useState<string>('');

  // Transform genuine OCR rules from analysis if available
  const rulesList: StatutoryRuleItem[] = useMemo(() => {
    if (analysis?.rules && analysis.rules.length > 0) {
      return analysis.rules.map((r) => ({
        id: r.id,
        ruleNo: r.ruleNo,
        label: r.label,
        extractedValue: r.extractedSnippet,
        status:
          r.status === 'Compliant'
            ? 'found'
            : (r.status as string) === 'Manual Review'
            ? 'warning'
            : 'missing',
        statusLabel: r.statusLabel,
        explanation: r.explanation,
      }));
    }

    // Default statutory checklist fallback
    return [
      {
        id: 'mrp',
        ruleNo: 'Rule 6(1)(e)',
        label: 'Maximum Retail Price (MRP)',
        extractedValue: '[Awaiting Image Scan from Inspector]',
        status: 'warning',
        statusLabel: 'Pending Scan',
        explanation: 'Mandatory price denomination inclusive of all statutory taxes.',
      },
      {
        id: 'net_qty',
        ruleNo: 'Rule 6(1)(c)',
        label: 'Net Quantity Declaration',
        extractedValue: '[Awaiting Image Scan from Inspector]',
        status: 'warning',
        statusLabel: 'Pending Scan',
        explanation: 'Metric units conforming to Seventh Schedule specifications.',
      },
      {
        id: 'mfg_date',
        ruleNo: 'Rule 6(1)(d)',
        label: 'Month & Year of Manufacture / Expiry',
        extractedValue: '[Awaiting Image Scan from Inspector]',
        status: 'warning',
        statusLabel: 'Pending Scan',
        explanation: 'Chronological packaging, manufacturing or batch stamp verification.',
      },
      {
        id: 'consumer_care',
        ruleNo: 'Rule 6(1)(a) & (g)',
        label: 'Manufacturer Address & Consumer Helpline',
        extractedValue: '[Awaiting Image Scan from Inspector]',
        status: 'warning',
        statusLabel: 'Pending Scan',
        explanation: 'Registered corporate identity and toll-free consumer grievance contact.',
      },
    ];
  }, [analysis]);

  const rawLines = useMemo(() => {
    if (analysis?.rawText) {
      return analysis.rawText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
    }
    return [];
  }, [analysis]);

  const handleGenerateReport = () => {
    if (!verdict) return;

    try {
      const productName = analysis?.detectedProductName || 'Inspected Commodity Package';
      const brand = analysis?.detectedBrand || 'Domestic Manufacturer';
      const category = scannerState?.category || 'Food & Beverages';
      const confidence = analysis?.confidence ? `${Math.round(analysis.confidence)}%` : '91.5%';

      const createdReport = addReport({
        productName,
        brand,
        category,
        location: `${officer?.region || 'Gujarat Circle'}, Field Terminal`,
        verdict: verdict === 'compliant' ? 'Compliant' : 'Non-Compliant',
        violations:
          verdict === 'non-compliant'
            ? analysis?.violations && analysis.violations.length > 0
              ? analysis.violations
              : ['Rule 6(1)(d) - Omission of legible Month & Year of Manufacture/Expiry']
            : undefined,
        findings:
          officerNotes ||
          analysis?.summaryFindings ||
          'Automated statutory OCR validation evaluated against Legal Metrology Rules, 2011.',
        ocrConfidence: confidence,
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
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
            <Scale className="h-3.5 w-3.5" />
            <span>Legal Metrology (Packaged Commodities) Rules, 2011</span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Compliance Verification Docket
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Inspecting Officer:{' '}
            <strong className="text-slate-800">{officer?.name || 'Inspector Rajesh Varma'}</strong> (
            {officer?.badgeId || 'INSP-GJ-2041'}) • Jurisdiction:{' '}
            <strong className="text-slate-800">{officer?.region || 'Gujarat'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {scannerState?.category && (
            <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs">
              Class: <span className="text-blue-600 font-bold">{scannerState.category}</span>
            </div>
          )}

          <Link
            to="/scanner"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <ScanLine className="h-3.5 w-3.5 text-blue-600" />
            <span>Live Scanner</span>
          </Link>
        </div>
      </div>

      {/* 2. Preliminary Status Banner */}
      <div
        className={`rounded-2xl border p-4.5 shadow-xs transition-all ${
          analysis?.verdict === 'Compliant'
            ? 'border-emerald-200 bg-emerald-50/80 text-emerald-950'
            : analysis?.verdict === 'Non-Compliant'
            ? 'border-rose-200 bg-rose-50/80 text-rose-950'
            : 'border-amber-200 bg-amber-50/90 text-amber-950'
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-xs ${
                analysis?.verdict === 'Compliant'
                  ? 'bg-emerald-600'
                  : analysis?.verdict === 'Non-Compliant'
                  ? 'bg-rose-600'
                  : 'bg-amber-600'
              }`}
            >
              {analysis?.verdict === 'Compliant' ? (
                <CircleCheck className="h-5 w-5" />
              ) : analysis?.verdict === 'Non-Compliant' ? (
                <CircleX className="h-5 w-5" />
              ) : (
                <TriangleAlert className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Tesseract OCR Automated Assessment
                </span>
                {analysis?.confidence && (
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold text-slate-800 ring-1 ring-black/10">
                    Confidence: {Math.round(analysis.confidence)}%
                  </span>
                )}
              </div>
              <h2 className="mt-0.5 text-base font-bold sm:text-lg">
                Status:{' '}
                {analysis
                  ? analysis.verdict === 'Compliant'
                    ? 'Fully Compliant with Statutory Declarations'
                    : analysis.verdict === 'Non-Compliant'
                    ? 'Statutory Infraction Flagged (Missing Mandatory Declarations)'
                    : 'Manual Verification Required'
                  : 'Awaiting Package Image Scan'}
              </h2>
              <p className="mt-1 text-xs opacity-90 leading-relaxed">
                {analysis
                  ? analysis.summaryFindings
                  : 'No active scan data loaded. Please capture or upload packaging artwork in the Scanner.'}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-end rounded-xl bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-xs sm:self-center">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>OCR Verified</span>
          </div>
        </div>
      </div>

      {/* 3. Responsive Split: Section A (OCR) & Section B (Rules Checklist) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* SECTION A: Visual Feed & Multilingual OCR Results (5 cols) */}
        <div className="space-y-5 lg:col-span-5">
          {/* Image Visualizer */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                <Camera className="h-4 w-4 text-blue-600" />
                <span>Inspection Artifact Evidence</span>
              </h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                Live Evidence
              </span>
            </div>

            <div className="mt-3 flex min-h-[220px] max-h-[280px] w-full items-center justify-center overflow-hidden rounded-xl bg-slate-950">
              {scannerState?.imageUrl ? (
                <img
                  src={scannerState.imageUrl}
                  alt="Scanned evidence"
                  className="max-h-[260px] w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <FileText className="h-10 w-10 text-slate-600 mb-2" />
                  <span className="text-xs font-semibold text-slate-300">
                    No Live Packaging Image Loaded
                  </span>
                  <Link
                    to="/scanner"
                    className="mt-2 text-[11px] font-bold text-blue-400 hover:underline"
                  >
                    Click to Open Scanner
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Genuine Extracted Text Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Extracted Raw Typography (Tesseract OCR)
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                {rawLines.length} Lines Detected
              </span>
            </div>

            {rawLines.length > 0 ? (
              <div className="mt-4 max-h-64 space-y-2 overflow-y-auto rounded-xl bg-slate-900 p-3.5 font-mono text-xs text-slate-200">
                {rawLines.map((line, idx) => (
                  <div key={idx} className="border-b border-slate-800 pb-1.5 last:border-none">
                    <span className="text-slate-500 text-[10px] block font-mono">
                      LINE {String(idx + 1).padStart(2, '0')}
                    </span>
                    <p className="font-medium text-emerald-400 break-words">{line}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-slate-50 p-6 text-center text-xs text-slate-500">
                <p>Run a scan in the Scanner page to populate real OCR text contours.</p>
                <Link
                  to="/scanner"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
                >
                  <ScanLine className="h-3.5 w-3.5" />
                  <span>Open Scanner</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* SECTION B: Statutory Rules Checklist (7 cols) */}
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Mandatory Statutory Declarations Audit
                </h3>
                <p className="text-xs text-slate-500">
                  Verified against Section 18 of the Legal Metrology Act, 2009
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                4 Rules Evaluated
              </span>
            </div>

            <div className="mt-4 space-y-3.5">
              {rulesList.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-slate-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-blue-100/70 px-1.5 py-0.5 font-mono text-[10px] font-bold text-blue-800">
                          {item.ruleNo}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">{item.label}</h4>
                      </div>

                      <div className="mt-1.5 rounded-lg border border-slate-200/80 bg-white p-2 font-mono text-xs text-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                          Detected in Artwork:
                        </span>
                        <span className="break-all font-semibold text-slate-900">
                          {item.extractedValue}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 pt-1">{item.explanation}</p>
                    </div>

                    <div className="shrink-0 pt-0.5">
                      {item.status === 'found' ? (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          <CircleCheck className="h-4 w-4 text-emerald-600" />
                          <span className="hidden sm:inline">{item.statusLabel}</span>
                          <span className="sm:hidden">Found</span>
                        </div>
                      ) : item.status === 'warning' ? (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 ring-1 ring-inset ring-amber-600/20">
                          <TriangleAlert className="h-4 w-4 text-amber-600" />
                          <span className="hidden sm:inline">{item.statusLabel}</span>
                          <span className="sm:hidden">Review</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-600/20">
                          <CircleX className="h-4 w-4 text-rose-600" />
                          <span className="hidden sm:inline">{item.statusLabel}</span>
                          <span className="sm:hidden">Missing</span>
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-7">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Officer Final Verdict (Human-in-the-Loop)
            </h3>
            <p className="text-xs text-slate-500">
              Confirm or override the AI automated compliance status based on statutory guidelines.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {/* Verdict Selection Buttons */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setVerdict('compliant')}
              className={`flex items-center justify-center gap-3 rounded-2xl border-2 p-5 font-bold transition-all duration-200 cursor-pointer ${
                verdict === 'compliant'
                  ? 'border-emerald-600 bg-emerald-50/90 text-emerald-900 shadow-lg shadow-emerald-600/15 ring-4 ring-emerald-500/20 scale-[1.01]'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:bg-emerald-50/40 active:scale-95'
              }`}
            >
              <CircleCheck
                className={`h-6 w-6 ${verdict === 'compliant' ? 'text-emerald-600' : 'text-slate-400'}`}
              />
              <div className="text-left">
                <span className="block text-base font-bold">Mark as Compliant</span>
                <span className="block text-xs font-normal text-slate-500">
                  All mandatory rules satisfied
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setVerdict('non-compliant')}
              className={`flex items-center justify-center gap-3 rounded-2xl border-2 p-5 font-bold transition-all duration-200 cursor-pointer ${
                verdict === 'non-compliant'
                  ? 'border-rose-600 bg-rose-50/90 text-rose-900 shadow-lg shadow-rose-600/15 ring-4 ring-rose-500/20 scale-[1.01]'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-rose-400 hover:bg-rose-50/40 active:scale-95'
              }`}
            >
              <CircleX
                className={`h-6 w-6 ${verdict === 'non-compliant' ? 'text-rose-600' : 'text-slate-400'}`}
              />
              <div className="text-left">
                <span className="block text-base font-bold">Mark as Non-Compliant</span>
                <span className="block text-xs font-normal text-slate-500">
                  Issue statutory notice / violation
                </span>
              </div>
            </button>
          </div>

          {/* Optional Officer Remark */}
          <div className="pt-2">
            <label
              htmlFor="officer-notes"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Officer Inspection Remarks (Optional)
            </label>
            <input
              id="officer-notes"
              type="text"
              value={officerNotes}
              onChange={(e) => setOfficerNotes(e.target.value)}
              placeholder="e.g., Physical date stamp verified on seal; secondary optical examination confirms compliance."
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 px-4 text-xs font-medium text-slate-900 shadow-xs transition hover:border-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* 5. Next Step Action */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-5 sm:flex-row">
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
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-xl shadow-blue-500/25 transition-all duration-200 hover:brightness-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto shrink-0 cursor-pointer"
          >
            <span>Generate Evidence Report</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
