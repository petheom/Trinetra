import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  UploadCloud,
  RefreshCw,
  TriangleAlert,
  CircleCheck,
  ChevronRight,
  Sparkles,
  FileCheck,
  Loader2,
  Layers,
  Eye,
} from 'lucide-react';

type QualityState = 'idle' | 'checking' | 'optimal' | 'warning';

const CATEGORIES = [
  'Food & Beverages',
  'Personal Care & Cosmetics',
  'Household Commodities',
  'General Packaged Goods',
] as const;

type CategoryType = typeof CATEGORIES[number];

export default function Scanner() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('Food & Beverages');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [qualityStatus, setQualityStatus] = useState<QualityState>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Quality check simulation effect: strictly runs on image selection
  useEffect(() => {
    if (!selectedImage) {
      setQualityStatus('idle');
      return;
    }

    setQualityStatus('checking');

    const timer = window.setTimeout(() => {
      // 80% chance Optimal, 20% chance Warning
      const isOptimal = Math.random() < 0.8;
      setQualityStatus(isOptimal ? 'optimal' : 'warning');
    }, 1200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [selectedImage]);

  // Object URL memory cleanup
  useEffect(() => {
    return () => {
      if (selectedImage && selectedImage.startsWith('blob:')) {
        URL.revokeObjectURL(selectedImage);
      }
    };
  }, [selectedImage]);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, or WEBP).');
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setSelectedImage(previewUrl);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleRetake = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSelectedImage(null);
    setQualityStatus('idle');
  };

  const handleProceed = () => {
    try {
      navigate('/verification', {
        state: {
          imageUrl: selectedImage,
          category: selectedCategory,
          quality: qualityStatus,
        },
      });
    } catch (err) {
      console.error('Failed to navigate to verification:', err);
      window.location.href = '/verification';
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-6">
      {/* 1. Header & Compliance Badge */}
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Legal Metrology Rules, 2011 Automated Ingestion</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Package Inspection Scanner
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Acquire high-fidelity packaging artwork or photos for multi-panel statutory declaration checks.
          </p>
        </div>

        {/* Category Selector */}
        <div className="flex flex-col gap-1.5 sm:min-w-[240px]">
          <label htmlFor="category-select" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
            Regulatory Commodity Category
          </label>
          <div className="relative">
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as CategoryType)}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-3.5 pr-10 text-sm font-medium text-gray-800 shadow-sm transition hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />

      {/* 2. Image Intake / Dropzone (When no image is selected) */}
      {!selectedImage ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center transition-all duration-300 sm:p-16 ${
            isDragging
              ? 'border-blue-600 bg-blue-50/70 scale-[0.995] shadow-lg'
              : 'border-slate-300 bg-white/90 backdrop-blur-md hover:border-blue-500 hover:bg-blue-50/20 hover:shadow-xl hover:scale-[1.005]'
          }`}
        >
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 ring-8 ring-blue-50/50 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
            <UploadCloud className="h-10 w-10" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Upload Package Photo or Artwork
          </h2>
          <p className="mt-1.5 max-w-md text-xs sm:text-sm text-slate-500 leading-relaxed">
            Drag and drop your high-resolution scan here, or browse files from your field terminal camera.
          </p>

          {/* Compliance Guidance Notice */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3.5 text-left text-xs text-blue-900 sm:max-w-md shadow-xs">
            <FileCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <p>
              Ensure the <strong className="font-bold">Principal Display Panel (PDP)</strong>, MRP, Net Quantity, Batch No., and Manufacturer Declaration are legible and unobstructed.
            </p>
          </div>

          <div className="mt-7 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-500/25 transition-all duration-200 group-hover:scale-105 active:scale-95">
            <Camera className="h-4 w-4" />
            <span>Select Image File</span>
          </div>
        </div>
      ) : (
        /* 3. Inspection View: Preview & Quality Gate */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Image Canvas Preview (7 cols) */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-950 p-2 shadow-sm lg:col-span-7">
            <div className="relative flex min-h-[380px] max-h-[500px] w-full items-center justify-center overflow-hidden rounded-xl bg-black/60">
              <img
                src={selectedImage}
                alt="Uploaded package scan"
                className="max-h-[480px] w-full object-contain"
              />

              {/* Laser Scanning Indicator */}
              {qualityStatus === 'checking' && (
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-500/10 via-blue-500/25 to-transparent animate-pulse flex items-center justify-center">
                  <div className="h-0.5 w-full bg-blue-400 shadow-[0_0_16px_#38bdf8]" />
                </div>
              )}

              {/* View Overlay Tag */}
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-black/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                <Eye className="h-3.5 w-3.5 text-blue-400" />
                <span>Captured Feed</span>
              </div>
            </div>
          </div>

          {/* Right Column: Automated Quality Gate & Controls (5 cols) */}
          <div className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-5">
            <div className="space-y-5">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Pre-Ingestion Quality Gate
                </h3>
                <p className="mt-0.5 text-xs text-gray-400">
                  Automated computer vision sharpness & artifact validation
                </p>
              </div>

              {/* Quality Analysis States */}
              {qualityStatus === 'checking' && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-blue-100 bg-blue-50/50 py-10 px-4 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <h4 className="mt-3 text-sm font-semibold text-blue-900">
                    Evaluating Image Integrity
                  </h4>
                  <p className="mt-1 max-w-xs text-xs text-blue-700">
                    Evaluating image sharpness, glare, and orientation...
                  </p>
                </div>
              )}

              {qualityStatus === 'optimal' && (
                <div className="space-y-4">
                  {/* Status Badge */}
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
                    <CircleCheck className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-900">
                        Optimal Quality - High OCR Readiness
                      </h4>
                      <p className="mt-0.5 text-xs text-emerald-700">
                        Visual fidelity meets Legal Metrology Rule 7 verification standards.
                      </p>
                    </div>
                  </div>

                  {/* Metric Pills */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-center">
                      <span className="block text-[11px] font-medium text-gray-500">Sharpness</span>
                      <span className="mt-0.5 block text-sm font-bold text-gray-900">94%</span>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-center">
                      <span className="block text-[11px] font-medium text-gray-500">Contrast</span>
                      <span className="mt-0.5 block text-sm font-bold text-emerald-600">Good</span>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-center">
                      <span className="block text-[11px] font-medium text-gray-500">Legibility</span>
                      <span className="mt-0.5 block text-sm font-bold text-emerald-600">High</span>
                    </div>
                  </div>
                </div>
              )}

              {qualityStatus === 'warning' && (
                <div className="space-y-4">
                  {/* Status Badge */}
                  <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4">
                    <TriangleAlert className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-900">
                        Warning: Minor Glare Detected
                      </h4>
                      <p className="mt-0.5 text-xs text-amber-700">
                        Specular reflection identified on surface. Proceed with caution or retake with angled lighting.
                      </p>
                    </div>
                  </div>

                  {/* Metric Pills */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-center">
                      <span className="block text-[11px] font-medium text-gray-500">Sharpness</span>
                      <span className="mt-0.5 block text-sm font-bold text-amber-700">82%</span>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-center">
                      <span className="block text-[11px] font-medium text-gray-500">Contrast</span>
                      <span className="mt-0.5 block text-sm font-bold text-amber-700">Moderate</span>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-center">
                      <span className="block text-[11px] font-medium text-gray-500">Legibility</span>
                      <span className="mt-0.5 block text-sm font-bold text-amber-700">Acceptable</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Commodity Context Box */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5 text-xs text-gray-600">
                <span className="font-semibold text-gray-900">Selected Target: </span>
                <span>{selectedCategory}</span>
                <p className="mt-1 text-gray-500">
                  Statutory declarations will be validated against Indian Legal Metrology (Packaged Commodities) schedules for this commodity type.
                </p>
              </div>
            </div>

            {/* 4. Interactive Controls */}
            <div className="mt-8 flex flex-col gap-3 pt-5 border-t border-slate-100 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleRetake}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:border-slate-400 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <RefreshCw className="h-4 w-4 text-slate-500" />
                <span>Retake / Replace</span>
              </button>

              <button
                type="button"
                onClick={handleProceed}
                disabled={qualityStatus === 'checking'}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/35 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>Proceed to Statutory Verification</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
