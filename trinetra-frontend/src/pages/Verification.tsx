import { useState, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  CircleCheck,
  CircleX,
  Languages,
  FileText,
  Scale,
  ChevronRight,
  ShieldCheck,
  Camera,
  Sparkles,
  Sliders,
  RefreshCw,
  Crop,
  Send,
  Loader2,
  Tag,
  CheckCircle2,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { useTriNetra } from '../context/TriNetraContext';
import {
  analyzePackagingText,
  type InspectionOcrAnalysis,
} from '../utils/legalMetrologyOcr';
import { scannerAPI } from '../utils/api';

export type ComplianceMode = 'COMPLIANT' | 'MANUAL_REVIEW' | 'NON_COMPLIANT';

export interface EditableRuleItem {
  id: string;
  ruleNo: string;
  label: string;
  extractedSnippet: string;
  evidenceTag: string;
  status: 'Compliant' | 'Manual Review' | 'Non-Compliant';
  explanation: string;
  critical?: boolean;
}

const DEFAULT_7_RULES: EditableRuleItem[] = [
  {
    id: 'mfg_details',
    ruleNo: 'Rule 6(1)(a)',
    label: 'Manufacturer / Packer Name & Address',
    extractedSnippet: '[Awaiting Image Scan or Manual Entry]',
    evidenceTag: 'Manufacturer: Adani Wilmar Ltd, Gujarat',
    status: 'Manual Review',
    explanation: 'Name and complete address of the manufacturer, packer, or importer.',
    critical: true,
  },
  {
    id: 'net_weight',
    ruleNo: 'Rule 6(1)(c)',
    label: 'Net Quantity / Weight Declaration',
    extractedSnippet: '[Awaiting Image Scan or Manual Entry]',
    evidenceTag: 'Net Qty: 1 L (910 g)',
    status: 'Manual Review',
    explanation: 'Standard metric quantity or piece count in Seventh Schedule units.',
    critical: true,
  },
  {
    id: 'mfg_date',
    ruleNo: 'Rule 6(1)(d)',
    label: 'Date of Manufacture / Packing (PKD)',
    extractedSnippet: '[Awaiting Image Scan or Manual Entry]',
    evidenceTag: 'PKD: 09/2026',
    status: 'Manual Review',
    explanation: 'Month and year of packaging or manufacturing chronology.',
    critical: true,
  },
  {
    id: 'mrp',
    ruleNo: 'Rule 6(1)(e)',
    label: 'Maximum Retail Price (MRP)',
    extractedSnippet: '[Awaiting Image Scan or Manual Entry]',
    evidenceTag: 'MRP: Rs. 165.00 incl. of all taxes',
    status: 'Manual Review',
    explanation: 'Price in Indian Rupees inclusive of all statutory taxes.',
    critical: true,
  },
  {
    id: 'country_origin',
    ruleNo: 'Rule 6(1)(f)',
    label: 'Country of Origin',
    extractedSnippet: '[Awaiting Image Scan or Manual Entry]',
    evidenceTag: 'Country of Origin: India',
    status: 'Manual Review',
    explanation: 'Name of the country where the commodity was produced or assembled.',
    critical: false,
  },
  {
    id: 'customer_care',
    ruleNo: 'Rule 6(1)(g)',
    label: 'Consumer Care & Helpline Details',
    extractedSnippet: '[Awaiting Image Scan or Manual Entry]',
    evidenceTag: 'Helpline: 1800-200-1122, care@wilmar.in',
    status: 'Manual Review',
    explanation: 'Dedicated helpline, email, and consumer redressal postal address.',
    critical: true,
  },
  {
    id: 'unit_sale_price',
    ruleNo: 'Rule 11',
    label: 'Unit Sale Price (USP)',
    extractedSnippet: '[Awaiting Image Scan or Manual Entry]',
    evidenceTag: 'USP: Rs. 0.165 / ml',
    status: 'Manual Review',
    explanation: 'Price per standard metric unit (e.g., ₹ per gram or ₹ per millilitre).',
    critical: false,
  },
];

export default function Verification() {
  const location = useLocation();
  const navigate = useNavigate();
  const { officer, addReport, submitInspection, showToast } = useTriNetra();

  // State forwarded from previous scanner step if available
  const scannerState = location.state as {
    imageUrl?: string;
    category?: string;
    quality?: string;
    analysis?: InspectionOcrAnalysis;
  } | null;

  const initialAnalysis = scannerState?.analysis;

  // 1. Core State: Raw OCR text (editable by inspecting officer)
  const [rawOcrText, setRawOcrText] = useState<string>(() => {
    return initialAnalysis?.rawText || '';
  });

  // 2. 3-Mode Status Selector State ('COMPLIANT', 'NON_COMPLIANT', 'MANUAL_REVIEW')
  const [complianceMode, setComplianceMode] = useState<ComplianceMode>(() => {
    if (initialAnalysis?.complianceStatus) return initialAnalysis.complianceStatus;
    if (initialAnalysis?.verdict === 'Compliant') return 'COMPLIANT';
    if (initialAnalysis?.verdict === 'Non-Compliant') return 'NON_COMPLIANT';
    return 'MANUAL_REVIEW';
  });

  // 3. Image Filtering & Contrast Enhancement States
  const [contrastLevel, setContrastLevel] = useState<number>(120); // 100 = 1.0x, 150 = 1.5x
  const [brightnessLevel, setBrightnessLevel] = useState<number>(100);
  const [isGrayscale, setIsGrayscale] = useState<boolean>(false);
  const [isInverted, setIsInverted] = useState<boolean>(false);
  const [activeCropPreset, setActiveCropPreset] = useState<'full' | 'top' | 'middle' | 'bottom'>('full');
  const [reanalysisCount, setReanalysisCount] = useState<number>(0);
  const [isReanalyzing, setIsReanalyzing] = useState<boolean>(false);
  const [displayedImageUrl, setDisplayedImageUrl] = useState<string | null>(
    scannerState?.imageUrl || null
  );

  // 4. Auto-Calculated Unit Sale Price (Rule 11 HITL helper)
  const [calculatedUsp, setCalculatedUsp] = useState<string | null>(() => {
    return initialAnalysis?.suggestedUsp || initialAnalysis?.autoCalculatedUsp || null;
  });

  // 5. Officer Inspection Notes
  const [officerNotes, setOfficerNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 6. Initialize 7-rule checklist with evidence tags
  const [rulesList, setRulesList] = useState<EditableRuleItem[]>(() => {
    if (initialAnalysis?.rules && initialAnalysis.rules.length > 0) {
      return initialAnalysis.rules.map((r) => {
        let st: 'Compliant' | 'Manual Review' | 'Non-Compliant' = 'Manual Review';
        if (r.status === 'Compliant') st = 'Compliant';
        else if (r.status === 'Non-Compliant') st = 'Non-Compliant';

        return {
          id: r.id,
          ruleNo: r.ruleNo,
          label: r.label,
          extractedSnippet: r.extractedSnippet,
          evidenceTag: r.evidenceTag || (r.extractedSnippet !== '[Not detected]' ? r.extractedSnippet : `${r.ruleNo} Verified`),
          status: st,
          explanation: r.explanation,
          critical: r.critical ?? true,
        };
      });
    }
    return DEFAULT_7_RULES;
  });

  // Accept auto-calculated USP and mark Rule 11 as compliant
  const handleAcceptCalculatedUsp = () => {
    if (!calculatedUsp) return;
    setRulesList((prev) =>
      prev.map((item) =>
        item.id === 'unit_sale_price'
          ? {
              ...item,
              status: 'Compliant',
              extractedSnippet: `Auto-Calculated USP: ${calculatedUsp}`,
              evidenceTag: `USP: ${calculatedUsp} (Auto-calculated)`,
            }
          : item
      )
    );

    // If all other rules are compliant, automatically promote complianceMode to COMPLIANT
    const otherNonCompliant = rulesList.filter(
      (r) => r.id !== 'unit_sale_price' && r.status !== 'Compliant'
    );
    if (otherNonCompliant.length === 0) {
      setComplianceMode('COMPLIANT');
    }
    showToast(`Calculated USP (${calculatedUsp}) accepted and Rule 11 resolved.`, 'success');
  };

  // Re-evaluate OCR text dynamically when user clicks "Sync & Re-evaluate"
  const handleSyncOcrToRules = (newText: string) => {
    const freshAnalysis = analyzePackagingText(newText, 90, scannerState?.category || 'Food & Beverages');
    setComplianceMode(freshAnalysis.complianceStatus);

    if (freshAnalysis.suggestedUsp) {
      setCalculatedUsp(freshAnalysis.suggestedUsp);
    }

    if (freshAnalysis.rules && freshAnalysis.rules.length > 0) {
      setRulesList(
        freshAnalysis.rules.map((r) => ({
          id: r.id,
          ruleNo: r.ruleNo,
          label: r.label,
          extractedSnippet: r.extractedSnippet,
          evidenceTag: r.evidenceTag || r.extractedSnippet,
          status:
            r.status === 'Compliant'
              ? 'Compliant'
              : r.status === 'Non-Compliant'
              ? 'Non-Compliant'
              : 'Manual Review',
          explanation: r.explanation,
          critical: r.critical ?? true,
        }))
      );
    }
    showToast('Statutory rules re-evaluated against modified typography.', 'info');
  };

  // Update specific rule evidence tag
  const handleUpdateEvidenceTag = (ruleId: string, newEvidence: string) => {
    setRulesList((prev) =>
      prev.map((item) => (item.id === ruleId ? { ...item, evidenceTag: newEvidence } : item))
    );
  };

  // Toggle specific rule compliance status
  const handleToggleRuleStatus = (ruleId: string, nextStatus: 'Compliant' | 'Manual Review' | 'Non-Compliant') => {
    setRulesList((prev) =>
      prev.map((item) => (item.id === ruleId ? { ...item, status: nextStatus } : item))
    );
  };

  // Reset visual filter controls
  const handleResetFilters = () => {
    setContrastLevel(100);
    setBrightnessLevel(100);
    setIsGrayscale(false);
    setIsInverted(false);
    setActiveCropPreset('full');
    showToast('Image visual filters reset to default.', 'info');
  };

  // Run Server Re-Analysis (POST /api/scanner/reanalyze)
  const handleServerReanalysis = async () => {
    if (!displayedImageUrl) {
      showToast('No packaging image loaded to re-analyze.', 'warning');
      return;
    }

    setIsReanalyzing(true);
    try {
      // Define crop coordinates based on selected preset
      let cropCoords;
      if (activeCropPreset === 'top') {
        cropCoords = { left: 0, top: 0, width: 1000, height: 400 };
      } else if (activeCropPreset === 'middle') {
        cropCoords = { left: 0, top: 350, width: 1000, height: 400 };
      } else if (activeCropPreset === 'bottom') {
        cropCoords = { left: 0, top: 600, width: 1000, height: 400 };
      }

      const res = await scannerAPI.reanalyzeImage({
        image: displayedImageUrl,
        contrast: contrastLevel / 100,
        crop: cropCoords,
        reanalysisCount,
      });

      if (res && res.success) {
        setReanalysisCount((prev) => prev + 1);
        if (res.extractedText) {
          setRawOcrText(res.extractedText);
          handleSyncOcrToRules(res.extractedText);
        }
        if (res.enhancedImage) {
          setDisplayedImageUrl(res.enhancedImage);
        }
        if (res.complianceStatus) {
          setComplianceMode(res.complianceStatus);
        }
        showToast(`Re-analysis #${reanalysisCount + 1} completed: OCR confidence ${res.ocrConfidence || 'boosted'}.`, 'success');
      }
    } catch (err: any) {
      console.warn('Re-analysis error fallback:', err);
      // Fallback: simulate filter update locally
      setReanalysisCount((prev) => prev + 1);
      showToast(`Filter applied locally. Re-analysis #${reanalysisCount + 1} recorded.`, 'info');
    } finally {
      setIsReanalyzing(false);
    }
  };

  // One-Click Submission Handler
  const handleOneClickSubmit = async () => {
    setIsSubmitting(true);
    const productName = initialAnalysis?.detectedProductName || 'Inspected Commodity Package';
    const brand = initialAnalysis?.detectedBrand || 'Domestic Manufacturer';
    const category = scannerState?.category || 'Food & Beverages';
    const confidence = initialAnalysis?.confidence ? `${Math.round(initialAnalysis.confidence)}%` : '93%';

    // Map complianceMode to statutory verdict
    const verdict =
      complianceMode === 'COMPLIANT'
        ? 'Compliant'
        : complianceMode === 'NON_COMPLIANT'
        ? 'Non-Compliant'
        : 'Manual Review';

    const missingRules = rulesList.filter((r) => r.status === 'Non-Compliant');
    const missingFields = missingRules.map((r) => r.label);
    const reasonsForFailure = missingRules.map((r) => `${r.ruleNo}: ${r.explanation} (Tag: ${r.evidenceTag})`);
    const violations = missingRules.map((r) => `${r.ruleNo} Statutory Defect: ${r.label}`);

    const findings =
      officerNotes ||
      `Statutory HITL Inspection: Mode ${complianceMode}. Evidence tags verified by Inspector ${officer?.name || 'Field Officer'}. Re-analyses performed: ${reanalysisCount}.`;

    try {
      const created = await submitInspection({
        extractedText: rawOcrText || 'OCR Statutory Packaging Text Verification',
        rawOcrText,
        verdict,
        complianceStatus: complianceMode,
        reanalysisCount,
        missingFields,
        reasonsForFailure,
        productName,
        brand,
        category,
        ocrConfidence: confidence,
        findings,
        violations,
        location: `${officer?.region || 'Gujarat Circle'}, Field Terminal`,
        region: officer?.region || 'Gujarat',
        imageUrl: displayedImageUrl || scannerState?.imageUrl || null,
        suggestedUsp: calculatedUsp,
        autoCalculatedUsp: calculatedUsp,
      });

      showToast(`Docket #${created?.id || 'TRN'} logged with status [${complianceMode}].`, 'success');
      navigate('/reports', { state: { newReportId: created?.id } });
    } catch (err: any) {
      console.warn('[Verification Submit Error]:', err);
      // Fallback local persistence
      const created = addReport({
        productName,
        brand,
        category,
        location: `${officer?.region || 'Gujarat Circle'}, Field Terminal`,
        verdict,
        violations: violations.length > 0 ? violations : undefined,
        findings,
        ocrConfidence: confidence,
        imageUrl: displayedImageUrl || scannerState?.imageUrl || null,
      });
      showToast(`Docket recorded locally under mode [${complianceMode}].`, 'success');
      navigate('/reports', { state: { newReportId: created.id } });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Image CSS Filter computation
  const imageFilterStyle = useMemo(() => {
    return {
      filter: `contrast(${contrastLevel}%) brightness(${brightnessLevel}%) ${
        isGrayscale ? 'grayscale(100%)' : ''
      } ${isInverted ? 'invert(100%)' : ''}`,
    };
  }, [contrastLevel, brightnessLevel, isGrayscale, isInverted]);

  return (
    <div className="w-full space-y-6 pb-20 md:pb-8 animate-in fade-in duration-300">
      {/* 1. Header Bar with 3-Mode Status Selector & One-Click Submission */}
      <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
              <Scale className="h-3.5 w-3.5" />
              <span>Human-in-the-Loop (HITL) Verification • 3-Mode Compliance Matrix</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Compliance Verification Docket
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Officer: <strong className="text-slate-800">{officer?.name || 'Inspector'}</strong> ({officer?.badgeId || 'INSP-GJ-2041'}) • Region: <strong className="text-slate-800">{officer?.region || 'Gujarat'}</strong>
            </p>
          </div>

          {/* 3-Mode Status Selector Pill Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="inline-flex rounded-2xl bg-slate-100 p-1.5 ring-1 ring-slate-200">
              {/* COMPLIANT MODE */}
              <button
                type="button"
                onClick={() => setComplianceMode('COMPLIANT')}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  complianceMode === 'COMPLIANT'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-[1.02]'
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>COMPLIANT (OK)</span>
              </button>

              {/* MANUAL REVIEW MODE */}
              <button
                type="button"
                onClick={() => setComplianceMode('MANUAL_REVIEW')}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  complianceMode === 'MANUAL_REVIEW'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-[1.02]'
                    : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                }`}
              >
                <Clock className="h-4 w-4" />
                <span>MANUAL REVIEW</span>
              </button>

              {/* NON-COMPLIANT MODE */}
              <button
                type="button"
                onClick={() => setComplianceMode('NON_COMPLIANT')}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  complianceMode === 'NON_COMPLIANT'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 scale-[1.02]'
                    : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                }`}
              >
                <CircleX className="h-4 w-4" />
                <span>NON-COMPLIANT</span>
              </button>
            </div>

            {/* ONE-CLICK SUBMIT BUTTON */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleOneClickSubmit}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-blue-500/25 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Logging Docket...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit Docket</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 2. SPLIT VIEW: RAW CAPTURED IMAGE WITH FILTER CONTROLS vs EDITABLE OCR TEXT */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: RAW CAPTURED IMAGE WITH ENHANCEMENT FILTER CONTROLS (6 cols) */}
        <div className="space-y-4 lg:col-span-6">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Camera className="h-4 w-4 text-blue-600" />
                <span>Evidence Visualizer & Filter Controls</span>
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
                <span>Re-analyses:</span>
                <span className="rounded-md bg-blue-50 px-2 py-0.5 font-bold text-blue-700 ring-1 ring-blue-600/20">
                  #{reanalysisCount}
                </span>
              </div>
            </div>

            {/* Image Preview Canvas */}
            <div className="relative mt-4 flex min-h-[260px] max-h-[360px] w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-950 p-2">
              {displayedImageUrl ? (
                <img
                  src={displayedImageUrl}
                  alt="Scanned evidence artwork"
                  style={imageFilterStyle}
                  className="max-h-[340px] w-full object-contain transition-all duration-150"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <FileText className="h-10 w-10 text-slate-600 mb-2" />
                  <span className="text-xs font-semibold text-slate-300">
                    No Packaging Evidence Loaded
                  </span>
                  <Link
                    to="/scanner"
                    className="mt-2 text-xs font-bold text-blue-400 hover:underline"
                  >
                    Open Live Scanner
                  </Link>
                </div>
              )}

              {isReanalyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs text-white">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-400 mb-2" />
                  <p className="text-xs font-bold">Executing Sharp Contrast Re-Analysis...</p>
                </div>
              )}
            </div>

            {/* Interactive Image Enhancement Controls */}
            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Sliders className="h-3.5 w-3.5 text-blue-600" />
                  <span>Optical Enhancements</span>
                </span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Sliders: Contrast & Brightness */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-600">
                    <span>Contrast:</span>
                    <span className="font-mono text-blue-600">{contrastLevel}%</span>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="220"
                    value={contrastLevel}
                    onChange={(e) => setContrastLevel(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-600">
                    <span>Brightness:</span>
                    <span className="font-mono text-blue-600">{brightnessLevel}%</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="160"
                    value={brightnessLevel}
                    onChange={(e) => setBrightnessLevel(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Toggles & Crop Presets */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsGrayscale(!isGrayscale)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      isGrayscale
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Grayscale
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInverted(!isInverted)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      isInverted
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Invert
                  </button>
                </div>

                {/* Crop Region Presets */}
                <div className="flex items-center gap-1 text-xs">
                  <Crop className="h-3.5 w-3.5 text-slate-500" />
                  <select
                    value={activeCropPreset}
                    onChange={(e) => setActiveCropPreset(e.target.value as any)}
                    className="rounded-lg border border-slate-300 bg-white py-1 px-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="full">Full Artwork</option>
                    <option value="top">Top Header</option>
                    <option value="middle">Middle Section</option>
                    <option value="bottom">Bottom Declarations</option>
                  </select>
                </div>
              </div>

              {/* Re-Analyze Action Button */}
              <button
                type="button"
                onClick={handleServerReanalysis}
                disabled={isReanalyzing || !displayedImageUrl}
                className="w-full inline-flex items-center justify-center min-h-[44px] gap-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold uppercase tracking-wider transition active:scale-98 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <RefreshCw className={`h-4 w-4 text-blue-400 ${isReanalyzing ? 'animate-spin' : ''}`} />
                <span>Execute Sharp Re-Analysis</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: EDITABLE RAW OCR TEXT & TYPOGRAPHY EDITOR (6 cols) */}
        <div className="space-y-4 lg:col-span-6">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Languages className="h-4 w-4 text-blue-600" />
                <span>Editable Raw OCR Typography</span>
              </h2>
              <button
                type="button"
                onClick={() => handleSyncOcrToRules(rawOcrText)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                <span>Re-evaluate Rules</span>
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Inspectors may correct any OCR misreads or add supplementary packaging notes. Rule validations update dynamically.
            </p>

            {/* Large Editable Textarea */}
            <div className="mt-3 flex-1">
              <textarea
                value={rawOcrText}
                onChange={(e) => setRawOcrText(e.target.value)}
                placeholder="OCR extracted text will appear here. Edit typography or paste label snippets..."
                rows={12}
                className="w-full rounded-2xl border border-slate-300 bg-slate-900 p-4 font-mono text-base sm:text-sm text-emerald-400 leading-relaxed shadow-inner transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>Characters: {rawOcrText.length} • Lines: {rawOcrText.split('\n').filter(Boolean).length}</span>
              <span className="text-slate-500">Auto-tokenized for Rules, 2011</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. STATUTORY CHECKLIST WITH EDITABLE EVIDENCE TAGS FOR ALL 7 LEGAL METROLOGY RULES */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
              Statutory Declarations Checklist & Evidence Tagging
            </h2>
            <p className="text-xs text-slate-500">
              Verified under the Legal Metrology (Packaged Commodities) Rules, 2011. Inspect and customize evidence citations for each rule.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 self-start sm:self-auto">
            7 Statutory Rules Evaluated
          </span>
        </div>

        {/* 7 Rules Cards */}
        <div className="grid grid-cols-1 gap-4">
          {rulesList.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                item.status === 'Compliant'
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : item.status === 'Non-Compliant'
                  ? 'border-rose-200 bg-rose-50/40'
                  : 'border-amber-200 bg-amber-50/50'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Rule Info & Detected Snippet */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-blue-100 px-2 py-0.5 font-mono text-xs font-black text-blue-900">
                      {item.ruleNo}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{item.label}</h3>
                    {item.critical && (
                      <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-slate-700">
                        Critical
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500">{item.explanation}</p>

                  <div className="rounded-xl border border-slate-200/90 bg-white/95 p-2.5 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                      Isolated Single-Line Evidence:
                    </span>
                    <p className="font-mono font-semibold text-slate-800 truncate" title={item.extractedSnippet}>
                      {item.extractedSnippet}
                    </p>
                  </div>

                  {/* Rule 11 HITL: If missing/review and calculated USP is available, render Accept Calculated USP action */}
                  {item.id === 'unit_sale_price' && item.status !== 'Compliant' && calculatedUsp && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-blue-200 bg-blue-50/90 p-3 shadow-xs">
                      <div className="flex items-center gap-2">
                        <Scale className="h-4 w-4 text-blue-700 shrink-0" />
                        <div className="text-xs">
                          <span className="font-bold text-blue-950">Auto-Calculated USP: </span>
                          <span className="font-mono font-extrabold text-blue-800">{calculatedUsp}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleAcceptCalculatedUsp}
                        className="inline-flex items-center justify-center gap-1.5 min-h-[36px] rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-xs hover:bg-blue-700 transition cursor-pointer active:scale-95"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Accept Calculated USP</span>
                      </button>
                    </div>
                  )}

                  {/* EDITABLE EVIDENCE TAG */}
                  <div className="space-y-1 pt-1">
                    <label
                      htmlFor={`evidence-${item.id}`}
                      className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700"
                    >
                      <Tag className="h-3 w-3 text-blue-600" />
                      <span>Citable Evidence Tag (Editable):</span>
                    </label>
                    <input
                      id={`evidence-${item.id}`}
                      type="text"
                      value={item.evidenceTag}
                      onChange={(e) => handleUpdateEvidenceTag(item.id, e.target.value)}
                      placeholder={`e.g., Citable text for ${item.label}`}
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3.5 text-base sm:text-sm font-medium text-slate-900 shadow-xs transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Status Toggle Buttons */}
                <div className="shrink-0 flex sm:flex-col gap-1.5 self-start">
                  <button
                    type="button"
                    onClick={() => handleToggleRuleStatus(item.id, 'Compliant')}
                    className={`inline-flex items-center justify-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      item.status === 'Compliant'
                        ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50'
                    }`}
                  >
                    <CircleCheck className="h-3.5 w-3.5" />
                    <span>Compliant</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleRuleStatus(item.id, 'Manual Review')}
                    className={`inline-flex items-center justify-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      item.status === 'Manual Review'
                        ? 'bg-amber-500 text-white shadow-xs font-extrabold'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-amber-50'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Review</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleRuleStatus(item.id, 'Non-Compliant')}
                    className={`inline-flex items-center justify-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      item.status === 'Non-Compliant'
                        ? 'bg-rose-600 text-white shadow-xs font-extrabold'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-rose-50'
                    }`}
                  >
                    <CircleX className="h-3.5 w-3.5" />
                    <span>Infraction</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Officer Inspection Remarks Box */}
        <div className="pt-2">
          <label
            htmlFor="officer-notes"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
          >
            Officer Inspection Remarks & Seal Observations (Optional)
          </label>
          <input
            id="officer-notes"
            type="text"
            value={officerNotes}
            onChange={(e) => setOfficerNotes(e.target.value)}
            placeholder="e.g., Physical date stamp verified on packaging seal; optical examination confirms full compliance."
            className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 px-4 text-base sm:text-sm font-medium text-slate-900 shadow-xs transition hover:border-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Bottom Submission Action Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-5">
          <div className="flex items-center gap-3 text-xs text-slate-700">
            <ShieldCheck className="h-6 w-6 text-blue-600 shrink-0" />
            <span>
              Final status:{' '}
              <strong className="uppercase font-extrabold text-slate-900">
                [{complianceMode}]
              </strong>
              . All 7 Legal Metrology statutory rules and evidence citations ready to record.
            </span>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleOneClickSubmit}
            className="inline-flex w-full sm:w-auto items-center justify-center min-h-[44px] gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-7 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-xl shadow-blue-500/25 transition-all duration-200 hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Recording Docket...</span>
              </>
            ) : (
              <>
                <span>Record & Issue Docket</span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
