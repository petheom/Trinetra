import { useState, useRef, useEffect, type ChangeEvent, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Tesseract from 'tesseract.js';
import {
  Camera,
  UploadCloud,
  RefreshCw,
  CircleCheck,
  CircleX,
  ChevronRight,
  Sparkles,
  FileCheck,
  Loader2,
  Layers,
  Copy,
  Check,
  Download,
  FileDown,
  FileText,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  SwitchCamera,
  Video,
  X,
  ShieldAlert,
} from 'lucide-react';
import { useTriNetra } from '../context/TriNetraContext';
import { analyzePackagingText, type InspectionOcrAnalysis } from '../utils/legalMetrologyOcr';
import { generateInspectionPdf } from '../utils/generatePdfReport';

const CATEGORIES = [
  'Food & Beverages',
  'Personal Care & Cosmetics',
  'Household Commodities',
  'General Packaged Goods',
  'Pharmaceuticals & Health',
] as const;

type CategoryType = (typeof CATEGORIES)[number];

export default function Scanner() {
  const navigate = useNavigate();
  const { officer, addReport } = useTriNetra();

  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('Food & Beverages');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [intakeTab, setIntakeTab] = useState<'camera' | 'upload'>('camera');

  // Live Camera Stream States
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);

  // Real OCR Processing States
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('');
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<InspectionOcrAnalysis | null>(null);
  const [hasCopiedRawText, setHasCopiedRawText] = useState(false);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfNotice, setPdfNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // References
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fallbackCameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopLiveCamera();
      if (selectedImage && selectedImage.startsWith('blob:')) {
        URL.revokeObjectURL(selectedImage);
      }
    };
  }, [selectedImage]);

  // -------------------------------------------------------------
  // Live Camera Controls (navigator.mediaDevices.getUserMedia)
  // -------------------------------------------------------------
  const startLiveCamera = async (mode: 'environment' | 'user' = cameraFacingMode) => {
    setCameraError(null);
    setIsCameraStarting(true);
    setIsLiveCameraOpen(true);

    // Stop previous track if running
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          'Camera access is not supported by your browser or connection is not secure (HTTPS / localhost).'
        );
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!isMountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch((err) => {
          console.warn('Video playback warning:', err);
        });
      }
    } catch (err: unknown) {
      console.error('Camera initialization error:', err);
      let errorMsg = 'Failed to open camera.';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMsg = 'Camera permission denied. Please allow camera permissions in your browser or address bar.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMsg = 'No camera device was detected on your hardware.';
        } else {
          errorMsg = err.message || 'Unable to access live camera stream.';
        }
      }
      setCameraError(errorMsg);
    } finally {
      if (isMountedRef.current) {
        setIsCameraStarting(false);
      }
    }
  };

  const stopLiveCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsLiveCameraOpen(false);
    setIsCameraStarting(false);
  };

  const toggleCameraFacingMode = () => {
    const nextMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(nextMode);
    startLiveCamera(nextMode);
  };

  const captureLivePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      alert('Camera feed is not ready for capture.');
      return;
    }

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      alert('Unable to capture frame from video.');
      return;
    }

    // Mirror image if in selfie / user mode
    if (cameraFacingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          alert('Failed to process captured image.');
          return;
        }

        const snapshotFile = new File([blob], `trinetra_capture_${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });

        // Stop camera tracks once captured
        stopLiveCamera();

        // Process file for preview & OCR
        handleFileProcess(snapshotFile);
      },
      'image/jpeg',
      0.95
    );
  };

  // -------------------------------------------------------------
  // File Selection and Drag & Drop
  // -------------------------------------------------------------
  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, WEBP, etc.).');
      return;
    }

    if (selectedImage && selectedImage.startsWith('blob:')) {
      URL.revokeObjectURL(selectedImage);
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedImage(previewUrl);
    setSelectedFile(file);
    setFileDetails({
      name: file.name || 'packaging_photo.jpg',
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
    });

    // Reset previous scan states
    setAnalysisResult(null);
    setOcrError(null);
    setSavedReportId(null);
    setPdfNotice(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleReset = () => {
    stopLiveCamera();
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (fallbackCameraInputRef.current) fallbackCameraInputRef.current.value = '';
    if (selectedImage && selectedImage.startsWith('blob:')) {
      URL.revokeObjectURL(selectedImage);
    }
    setSelectedImage(null);
    setSelectedFile(null);
    setFileDetails(null);
    setAnalysisResult(null);
    setOcrError(null);
    setIsScanning(false);
    setScanProgress(0);
    setSavedReportId(null);
    setIsGeneratingPdf(false);
    setPdfNotice(null);
  };

  // -------------------------------------------------------------
  // REAL TESSERACT OCR EXECUTION & STRICT 2011 RULES VALIDATION
  // -------------------------------------------------------------
  const handleRunOcrScan = async () => {
    if (!selectedFile && !selectedImage) {
      alert('Please snap or upload a packaging photo first.');
      return;
    }

    setIsScanning(true);
    setScanProgress(5);
    setScanStatusText('Initializing Tesseract OCR neural engine...');
    setOcrError(null);
    setAnalysisResult(null);

    try {
      const imageSource = selectedFile || selectedImage;

      const result = await Tesseract.recognize(imageSource!, 'eng', {
        logger: (m) => {
          if (!isMountedRef.current) return;
          if (m && typeof m.progress === 'number') {
            const pct = Math.min(Math.round(m.progress * 100), 98);
            setScanProgress(pct);

            const status = String(m.status || '').toLowerCase();
            if (status.includes('loading')) {
              setScanStatusText(`Loading language weights... (${pct}%)`);
            } else if (status.includes('init')) {
              setScanStatusText(`Initializing OCR pipeline... (${pct}%)`);
            } else if (status.includes('recogniz')) {
              setScanStatusText(`Recognizing packaging typography & declarations... (${pct}%)`);
            } else {
              setScanStatusText(`Processing artwork frame... (${pct}%)`);
            }
          }
        },
      });

      if (!isMountedRef.current) return;

      const rawExtractedText = result.data.text || '';
      const confidence = result.data.confidence || 0;

      if (!rawExtractedText.trim()) {
        setOcrError(
          'No readable text could be recognized from this image. Please ensure direct lighting, sharp focus, and high contrast on the packaging declarations.'
        );
        setIsScanning(false);
        setScanProgress(100);
        return;
      }

      setScanStatusText('Auditing against Legal Metrology (Packaged Commodities) Rules, 2011...');
      setScanProgress(99);

      // STRICT VALIDATION ENGINE: MUST CONTAIN MRP, NET WEIGHT/QTY, MFG DATE/PKD, CUSTOMER CARE
      // IF ANY MISSING -> NON-COMPLIANT (FAIL)
      const analysis = analyzePackagingText(rawExtractedText, confidence, selectedCategory);

      setAnalysisResult(analysis);
      setScanProgress(100);
      setScanStatusText('Statutory compliance audit complete.');
    } catch (err: unknown) {
      console.error('Tesseract OCR Failure:', err);
      if (isMountedRef.current) {
        setOcrError(
          err instanceof Error
            ? `OCR Engine Error: ${err.message}`
            : 'An unexpected error occurred while analyzing the packaging image. Please try again.'
        );
      }
    } finally {
      if (isMountedRef.current) {
        setIsScanning(false);
      }
    }
  };

  // -------------------------------------------------------------
  // Save genuine inspection report to context / localStorage
  // -------------------------------------------------------------
  const handleSaveReport = () => {
    if (!analysisResult) return;

    try {
      const createdReport = addReport({
        productName: analysisResult.detectedProductName,
        brand: analysisResult.detectedBrand,
        category: selectedCategory,
        location: `${officer?.region || 'Gujarat Circle'}, Field Terminal`,
        verdict: analysisResult.verdict,
        violations: analysisResult.violations.length > 0 ? analysisResult.violations : undefined,
        findings: analysisResult.summaryFindings,
        ocrConfidence: `${Math.round(analysisResult.confidence)}%`,
        imageUrl: selectedImage,
      });

      setSavedReportId(createdReport.id);
    } catch (e) {
      console.error('Failed to save report:', e);
      alert('Unable to persist report record. Please check browser storage permissions.');
    }
  };

  const handleCopyRawText = () => {
    if (!analysisResult?.rawText) return;
    navigator.clipboard.writeText(analysisResult.rawText);
    setHasCopiedRawText(true);
    setTimeout(() => setHasCopiedRawText(false), 2000);
  };

  // -------------------------------------------------------------
  // REAL PDF REPORT EXPORT (jsPDF) with Strict 2011 Rules & Reasons for Failure
  // -------------------------------------------------------------
  const handleDownloadOfficialPdf = () => {
    if (!analysisResult) {
      alert('No inspection analysis available to generate report.');
      return;
    }

    setIsGeneratingPdf(true);
    setPdfNotice(null);

    try {
      const res = generateInspectionPdf(analysisResult, selectedCategory, {
        name: officer?.name,
        badgeId: officer?.badgeId,
        region: officer?.region,
        role: officer?.role,
      });

      if (res.success && res.filename) {
        setPdfNotice({
          type: 'success',
          message: `Official PDF Dossier (${res.filename}) generated & downloaded successfully!`,
        });
        setTimeout(() => {
          if (isMountedRef.current) {
            setPdfNotice(null);
          }
        }, 6000);
      } else {
        setPdfNotice({
          type: 'error',
          message: `PDF Generation Failed: ${res.error || 'Unknown error occurred'}`,
        });
      }
    } catch (err: unknown) {
      console.error('PDF Export Error:', err);
      setPdfNotice({
        type: 'error',
        message:
          err instanceof Error
            ? `PDF Export Error: ${err.message}`
            : 'An unexpected error occurred while generating the PDF.',
      });
    } finally {
      if (isMountedRef.current) {
        setIsGeneratingPdf(false);
      }
    }
  };

  const handleDownloadAnalysisLog = () => {
    if (!analysisResult) return;
    const content = [
      '===================================================================',
      'TRINETRA LEGAL METROLOGY SYSTEM - REAL-TIME OCR INSPECTION DOSSIER',
      'GOVERNING LAW: LEGAL METROLOGY (PACKAGED COMMODITIES) RULES, 2011',
      '===================================================================',
      `Timestamp:         ${new Date().toLocaleString()}`,
      `Inspecting Unit:   ${officer?.name || 'Field Officer'} (${officer?.badgeId || 'INSP-GJ-2041'})`,
      `Jurisdiction:      ${officer?.region || 'Gujarat Circle'}`,
      `Commodity Group:   ${selectedCategory}`,
      `OCR Confidence:    ${Math.round(analysisResult.confidence)}%`,
      `Statutory Verdict: ${analysisResult.verdict.toUpperCase()} under Rules, 2011`,
      `Status Summary:    ${analysisResult.missingFieldsSummary}`,
      '',
      ...(analysisResult.missingFields.length > 0
        ? [
            'REASONS FOR FAILURE (MISSING MANDATORY DECLARATIONS):',
            ...analysisResult.reasonsForFailure.map((r) => `* ${r}`),
            '',
          ]
        : ['COMPLIANCE NOTE: All 4 mandatory packaging declarations verified.', '']),
      'MANDATORY DECLARATIONS AUDIT BREAKDOWN:',
      ...analysisResult.rules.map(
        (r) =>
          `[${r.status.toUpperCase()}] ${r.ruleNo} - ${r.label}\n  Extracted: "${r.extractedSnippet}"\n  Finding:   ${r.explanation}`
      ),
      '',
      'RAW OCR EXTRACTED TEXT FROM PACKAGING ARTWORK:',
      '-------------------------------------------------------------------',
      analysisResult.rawText,
      '===================================================================',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TriNetra-OCR-Audit-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Hidden Offscreen Canvas for Live Camera Frame Snapping */}
      <canvas ref={canvasRef} className="hidden" />

      {/* 1. Header & Commodity Selector */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Legal Metrology (Packaged Commodities) Rules, 2011</span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Packaging Compliance Scanner
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Live device camera viewfinder & OCR inspection. Strictly validates MRP, Net Quantity, Mfg/PKD Date, and Customer Care declarations.
          </p>
        </div>

        {/* Category Selector */}
        <div className="flex flex-col gap-1.5 sm:min-w-[240px]">
          <label
            htmlFor="category-select"
            className="text-xs font-bold uppercase tracking-wider text-slate-500"
          >
            Commodity Classification
          </label>
          <div className="relative">
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as CategoryType)}
              className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-3.5 pr-10 text-sm font-semibold text-slate-800 shadow-xs transition hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Hidden File and Fallback Camera Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={fallbackCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 2. Intake Stage: When no image is loaded yet */}
      {!selectedImage ? (
        <div className="space-y-4">
          {/* Intake Mode Tabs */}
          <div className="flex items-center justify-center">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200">
              <button
                type="button"
                onClick={() => {
                  setIntakeTab('camera');
                  if (!isLiveCameraOpen) startLiveCamera('environment');
                }}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  intakeTab === 'camera'
                    ? 'bg-white text-blue-700 shadow-xs ring-1 ring-black/5'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Live Device Camera</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopLiveCamera();
                  setIntakeTab('upload');
                }}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  intakeTab === 'upload'
                    ? 'bg-white text-blue-700 shadow-xs ring-1 ring-black/5'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>Upload Artwork File</span>
              </button>
            </div>
          </div>

          {/* Camera Error Banner if any */}
          {cameraError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-3 shadow-xs">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Camera Access Error</p>
                <p className="mt-0.5 text-rose-700 leading-relaxed">{cameraError}</p>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startLiveCamera()}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-rose-700 cursor-pointer"
                  >
                    Retry Live Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => setIntakeTab('upload')}
                    className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 font-bold text-rose-700 hover:bg-rose-50 cursor-pointer"
                  >
                    Switch to File Upload
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: LIVE DEVICE CAMERA VIEWFINDER */}
          {intakeTab === 'camera' && (
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
              {/* Viewfinder Video Frame */}
              <div className="relative flex aspect-video max-h-[500px] w-full items-center justify-center overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />

                {/* Viewfinder Target Framing Overlay */}
                <div className="pointer-events-none absolute inset-6 sm:inset-12 flex flex-col justify-between rounded-2xl border-2 border-dashed border-emerald-400/80 p-3 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-black/70 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300 backdrop-blur-xs">
                      [PRINCIPAL DISPLAY PANEL - PDP]
                    </span>
                    <span className="rounded bg-black/70 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300 backdrop-blur-xs">
                      RULES, 2011 AUDIT
                    </span>
                  </div>

                  {/* Center Target Crosshairs */}
                  <div className="self-center flex items-center gap-2 text-emerald-400/50 font-mono text-xs">
                    <span>+</span>
                    <span>Align MRP, Net Wt, Mfg & Care</span>
                    <span>+</span>
                  </div>

                  <div className="self-end text-[10px] font-mono text-emerald-300 bg-black/70 px-2 py-0.5 rounded backdrop-blur-xs">
                    480p - 1080p Optical Stream
                  </div>
                </div>

                {/* Top Status Overlay Bar */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between px-2 pointer-events-auto">
                  <div className="flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white backdrop-blur-md border border-white/10">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                    <span>LIVE FEED ACTIVE</span>
                    <span className="text-slate-400 font-normal">|</span>
                    <span className="text-[11px] text-slate-300 capitalize">
                      {cameraFacingMode === 'environment' ? 'Rear Camera' : 'Front Camera'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleCameraFacingMode}
                      className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md border border-white/10 hover:bg-black/90 transition cursor-pointer"
                      title="Switch Camera (Front/Rear)"
                    >
                      <SwitchCamera className="h-3.5 w-3.5 text-blue-400" />
                      <span>Flip Camera</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIntakeTab('upload')}
                      className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-black/70 text-slate-300 hover:text-white backdrop-blur-md border border-white/10 transition cursor-pointer"
                      title="Close Live Camera"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Loading State Overlay */}
                {isCameraStarting && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xs text-white">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-400 mb-2" />
                    <p className="text-sm font-bold">Initializing Live Camera Stream...</p>
                    <p className="text-xs text-slate-400 mt-1">Please approve camera permissions in your browser</p>
                  </div>
                )}
              </div>

              {/* Bottom Live Shutter Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 bg-slate-900/95 px-6 py-4 backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Video className="h-4 w-4 text-emerald-400" />
                  <span>Ensure lighting is direct and typography on packaging is legible.</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={captureLivePhoto}
                    disabled={isCameraStarting}
                    className="group relative inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 px-6 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-xl shadow-emerald-500/25 transition-all duration-150 hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Camera className="h-5 w-5 transition group-hover:scale-110" />
                    <span>Capture Packaging Photo</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRADITIONAL DROPZONE & FILE UPLOAD */}
          {intakeTab === 'upload' && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`group relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-300 sm:p-14 ${
                isDragging
                  ? 'border-blue-600 bg-blue-50/70 scale-[0.995] shadow-lg'
                  : 'border-slate-300 bg-white hover:border-blue-500 hover:bg-blue-50/20 hover:shadow-xl'
              }`}
            >
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 ring-8 ring-blue-50/50 shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
                <UploadCloud className="h-10 w-10" />
              </div>

              <h2 className="text-xl font-bold text-slate-900 tracking-tight sm:text-2xl">
                Upload Packaging Photo or Artwork
              </h2>
              <p className="mt-1.5 max-w-md text-xs sm:text-sm text-slate-500 leading-relaxed">
                Drag and drop an image file here, or choose from your local drive for genuine Legal Metrology OCR extraction.
              </p>

              {/* Compliance Guidance Notice */}
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3.5 text-left text-xs text-blue-900 sm:max-w-lg shadow-xs">
                <FileCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <p>
                  <strong className="font-bold">2011 Rules Requirement:</strong> Capture the Principal Display Panel (PDP) showing legible <span className="font-semibold text-blue-700">MRP, Net Weight/Volume, Date of Mfg/PKD, and Customer Care</span> declarations.
                </p>
              </div>

              {/* Dual Actions: File Upload + System Fallback */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-500/25 transition-all duration-150 hover:brightness-110 active:scale-95 cursor-pointer"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Browse Image File</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIntakeTab('camera');
                    startLiveCamera('environment');
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-xs transition-all duration-150 hover:bg-slate-50 hover:text-slate-900 active:scale-95 cursor-pointer"
                >
                  <Camera className="h-4 w-4 text-slate-500" />
                  <span>Launch Live Camera</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 3. Image Loaded: Preview Canvas & OCR Actions */
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Image Canvas & Metadata (5 cols) */}
            <div className="space-y-4 lg:col-span-5">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-2.5 shadow-sm">
                <div className="relative flex min-h-[320px] max-h-[460px] w-full items-center justify-center overflow-hidden rounded-xl bg-black/70">
                  <img
                    src={selectedImage}
                    alt="Inspected packaging artwork"
                    className="max-h-[440px] w-full object-contain"
                  />

                  {/* OCR Scanning In-Flight Overlay */}
                  {isScanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 p-6 backdrop-blur-xs text-white text-center">
                      <div className="relative mb-4 flex h-16 w-16 items-center justify-center">
                        <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/30" />
                        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                      </div>
                      <p className="text-sm font-bold text-slate-100">{scanStatusText}</p>
                      <div className="mt-3 w-48 h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-200"
                          style={{ width: `${scanProgress}%` }}
                        />
                      </div>
                      <span className="mt-1.5 font-mono text-xs text-blue-300 font-bold">
                        {scanProgress}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Image Details Bar & Retake Actions */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-800">
                    {fileDetails?.name || 'packaging_photo.jpg'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Size: {fileDetails?.size || 'Original Artwork'} • Category:{' '}
                    <span className="font-semibold text-slate-600">{selectedCategory}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isScanning}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 cursor-pointer"
                  title="Retake or choose different photo"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Retake</span>
                </button>
              </div>

              {/* Trigger OCR Scan Action */}
              {!analysisResult && !isScanning && (
                <button
                  type="button"
                  onClick={handleRunOcrScan}
                  className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 py-3.5 px-6 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:brightness-110 active:scale-98 cursor-pointer"
                >
                  <Sparkles className="h-5 w-5" />
                  <span>Scan Package with Tesseract OCR</span>
                </button>
              )}
            </div>

            {/* Right Column: OCR Progress, Errors, or STRICT 2011 RESULTS (7 cols) */}
            <div className="space-y-4 lg:col-span-7">
              {/* State A: Scanning Active Progress Card */}
              {isScanning && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 text-center space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/30 animate-pulse">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Executing Client-Side Neural OCR
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Tesseract.js is reading package typography directly in your browser.
                    </p>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-white p-3 text-left">
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Audit Engine Status:</span>
                      <span className="text-blue-600">{scanProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 font-mono">{scanStatusText}</p>
                  </div>
                </div>
              )}

              {/* State B: OCR Engine Error */}
              {ocrError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-rose-900">Optical Analysis Failure</h4>
                      <p className="mt-1 text-xs text-rose-700 leading-relaxed">{ocrError}</p>
                    </div>
                  </div>
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRunOcrScan}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Retry OCR Recognition</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <span>Upload Clearer Image</span>
                    </button>
                  </div>
                </div>
              )}

              {/* State C: Ready to Scan Prompt */}
              {!analysisResult && !isScanning && !ocrError && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
                  <div className="flex items-center gap-2 text-slate-800">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    <h3 className="font-bold text-sm">Ready for Statutory 2011 Rules Audit</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Click <strong className="text-slate-800 font-semibold">"Scan Package with Tesseract OCR"</strong> to extract typography and audit against the 4 mandatory packaging declarations under the Legal Metrology (Packaged Commodities) Rules, 2011.
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[11px] font-bold text-slate-700">1. Rule 6(1)(e): MRP</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Maximum Retail Price incl. of all taxes
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[11px] font-bold text-slate-700">2. Rule 6(1)(c): Net Qty</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Net Weight/Volume in standard metric units
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[11px] font-bold text-slate-700">3. Rule 6(1)(d): Mfg Date</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Month & Year of Mfg/PKD and batch code
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[11px] font-bold text-slate-700">4. Rule 6(1)(g): Customer Care</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Helpline, email, or grievance redressal
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* State D: REAL STRICT STATUTORY COMPLIANCE RESULTS */}
              {analysisResult && (
                <div className="space-y-4">
                  {/* Strict Verdict Banner */}
                  <div
                    className={`rounded-2xl border p-5 shadow-sm transition-all ${
                      analysisResult.verdict === 'Compliant'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                        : 'border-rose-300 bg-rose-50 text-rose-950'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-md ${
                            analysisResult.verdict === 'Compliant'
                              ? 'bg-emerald-600 shadow-emerald-600/30'
                              : 'bg-rose-600 shadow-rose-600/30'
                          }`}
                        >
                          {analysisResult.verdict === 'Compliant' ? (
                            <CircleCheck className="h-6 w-6" />
                          ) : (
                            <CircleX className="h-6 w-6" />
                          )}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base sm:text-lg font-black tracking-tight">
                              Statutory Verdict: {analysisResult.verdict === 'Compliant' ? 'COMPLIANT (PASS)' : 'NON-COMPLIANT (FAIL)'}
                            </h3>
                            <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ring-black/10">
                              OCR Confidence: {Math.round(analysisResult.confidence)}%
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-700 leading-snug">
                            {analysisResult.summaryFindings}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DYNAMIC ERROR DETAILS: IF FAILED, PROMINENTLY SHOW EXACT MISSING FIELDS */}
                  {analysisResult.verdict === 'Non-Compliant' && analysisResult.missingFields.length > 0 && (
                    <div className="rounded-2xl border-2 border-rose-300 bg-rose-50/90 p-4.5 shadow-xs space-y-3">
                      <div className="flex items-center gap-2 text-rose-900">
                        <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
                        <h4 className="font-black text-sm uppercase tracking-wide">
                          Reasons for Failure (Missing Declarations under Rules, 2011)
                        </h4>
                      </div>

                      <p className="text-xs text-rose-800 leading-relaxed font-semibold">
                        Under Legal Metrology (Packaged Commodities) Rules, 2011, all 4 declarations are mandatory. The following {analysisResult.missingFields.length} field(s) were not detected:
                      </p>

                      {/* Pill Badges for Missing Fields */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {analysisResult.missingFields.map((field) => (
                          <span
                            key={field}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs"
                          >
                            <CircleX className="h-3.5 w-3.5" />
                            <span>Missing: {field}</span>
                          </span>
                        ))}
                      </div>

                      {/* Detailed list of failure reasons */}
                      <div className="rounded-xl bg-white/80 p-3 border border-rose-200 text-[11px] text-rose-900 space-y-1.5">
                        {analysisResult.reasonsForFailure.map((reason, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="font-bold text-rose-600 shrink-0">[FAIL]</span>
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>

                      <p className="text-[11px] text-rose-700 italic">
                        Grounds for Seizure & Penalty under Section 36 of the Legal Metrology Act, 2009 for distributing non-conforming pre-packaged goods.
                      </p>
                    </div>
                  )}

                  {/* 4 Mandatory Declarations Audit Breakdown */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Mandatory Packaging Declarations Audit (Rules, 2011)
                    </h4>

                    <div className="grid grid-cols-1 gap-2.5">
                      {analysisResult.rules.map((rule) => {
                        const isPass = rule.status === 'Compliant';

                        return (
                          <div
                            key={rule.id}
                            className={`rounded-xl border p-3.5 shadow-xs transition ${
                              isPass
                                ? 'border-slate-200 bg-white hover:border-slate-300'
                                : 'border-rose-200 bg-rose-50/40 hover:border-rose-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                    isPass ? 'text-blue-600 bg-blue-50' : 'text-rose-700 bg-rose-100'
                                  }`}>
                                    {rule.ruleNo}
                                  </span>
                                  <span className="text-xs font-bold text-slate-900">
                                    {rule.label}
                                  </span>
                                </div>
                                <p className="mt-1 text-[11px] text-slate-500">
                                  {rule.explanation}
                                </p>
                              </div>

                              <span
                                className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${
                                  isPass
                                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                                    : 'bg-rose-600 text-white ring-rose-600/30'
                                }`}
                              >
                                {isPass ? (
                                  <CircleCheck className="h-3 w-3" />
                                ) : (
                                  <CircleX className="h-3 w-3" />
                                )}
                                <span>{isPass ? 'COMPLIANT' : 'NON-COMPLIANT'}</span>
                              </span>
                            </div>

                            {/* Extracted Snippet Quote */}
                            <div className="mt-2.5 rounded-lg border border-slate-100 bg-slate-50 p-2 text-[11px] font-mono text-slate-700">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                                Detected in Artwork:
                              </span>
                              <span className={`break-all font-semibold ${isPass ? 'text-slate-800' : 'text-rose-700'}`}>
                                {rule.extractedSnippet}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Raw OCR Text Terminal */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-slate-500" />
                        <span className="text-xs font-bold text-slate-800">
                          Extracted Raw OCR Text ({analysisResult.cleanText.length} chars)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyRawText}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                      >
                        {hasCopiedRawText ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Text</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="mt-2 max-h-36 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-2.5 font-mono text-[11px] text-emerald-400 leading-relaxed">
                      {analysisResult.rawText}
                    </pre>
                  </div>

                  {/* PDF Download Notice Toast if any */}
                  {pdfNotice && (
                    <div
                      className={`rounded-xl p-3 text-xs font-semibold flex items-center justify-between transition-all ${
                        pdfNotice.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs'
                          : 'bg-rose-50 text-rose-800 border border-rose-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {pdfNotice.type === 'success' ? (
                          <CircleCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                        )}
                        <span>{pdfNotice.message}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPdfNotice(null)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1.5 py-0.5 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Primary Luxurious PDF Report Download Action */}
                  <div className="rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-blue-50/60 p-3.5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
                          <FileDown className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-emerald-950">
                              Official Metrology Dossier
                            </span>
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                              Vector PDF
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            Includes 2011 Rules verdict and specific Reasons for Failure if non-compliant.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleDownloadOfficialPdf}
                        disabled={isGeneratingPdf}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 py-2.5 px-5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-emerald-600/25 hover:brightness-110 active:scale-95 transition disabled:opacity-75 cursor-pointer"
                      >
                        {isGeneratingPdf ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                            <span>Generating PDF...</span>
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 text-emerald-100" />
                            <span>Download Official Report</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons: Save to Docket, Export, or Re-scan */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    {!savedReportId ? (
                      <button
                        type="button"
                        onClick={handleSaveReport}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 px-5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-blue-500/25 hover:brightness-110 active:scale-95 transition cursor-pointer"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>Save to Enforcement Docket</span>
                      </button>
                    ) : (
                      <div className="flex-1 flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                        <div className="flex items-center gap-2">
                          <CircleCheck className="h-5 w-5 text-emerald-600" />
                          <span className="text-xs font-bold text-emerald-900">
                            Saved as Record {savedReportId}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate('/reports', { state: { newReportId: savedReportId } })}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                        >
                          <span>View Reports</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        navigate('/verification', {
                          state: {
                            analysis: analysisResult,
                            imageUrl: selectedImage,
                            category: selectedCategory,
                          },
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 py-3 px-4 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-xs hover:bg-blue-100 transition active:scale-95 cursor-pointer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Verification Docket</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadAnalysisLog}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-xs hover:bg-slate-50 transition active:scale-95 cursor-pointer"
                      title="Download text audit log"
                    >
                      <Download className="h-4 w-4 text-slate-500" />
                      <span>Export Dossier</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 shadow-xs hover:bg-slate-100 transition active:scale-95 cursor-pointer"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>New Scan</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
