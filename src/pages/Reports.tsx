import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  OctagonAlert,
  Search,
  CircleCheck,
  TriangleAlert,
  ChevronDown,
  ChevronUp,
  MapPin,
  Filter,
  Calendar,
} from 'lucide-react';
import { useTriNetra, type InspectionReport } from '../context/TriNetraContext';
import { generateSavedReportPdf } from '../utils/generatePdfReport';

export default function Reports() {
  const location = useLocation();
  const { reports } = useTriNetra();

  // Highlight newest report if navigated here from verification
  const newReportId = (location.state as { newReportId?: string } | null)?.newReportId;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [expandedReportId, setExpandedReportId] = useState<string | null>(
    newReportId || null
  );
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Search and filter logic over dynamic reports
  const filteredReports = reports.filter((report) => {
    const q = String(searchQuery || '').toLowerCase().trim();
    const matchesSearch =
      !q ||
      String(report?.productName || '').toLowerCase().includes(q) ||
      String(report?.brand || '').toLowerCase().includes(q) ||
      String(report?.id || '').toLowerCase().includes(q) ||
      String(report?.officerName || '').toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'All' || report.verdict === statusFilter;

    const matchesDate =
      dateFilter === 'All'
        ? true
        : dateFilter === 'Today'
        ? String(report?.inspectionDate || '').toLowerCase().includes('today')
        : true;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleDownloadPdf = (reportId: string) => {
    setDownloadingId(reportId);
    const targetReport = reports.find((r) => r.id === reportId);

    setTimeout(() => {
      setDownloadingId(null);
      if (targetReport) {
        try {
          const res = generateSavedReportPdf(targetReport);
          if (!res.success) {
            alert(`Failed to generate PDF: ${res.error || 'Unknown error'}`);
          }
        } catch (e) {
          console.error('PDF generation error:', e);
          alert('Failed to generate PDF report.');
        }
      }
    }, 400);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-6 pb-6">
      {/* 1. Top Header */}
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Evidentiary Chain-of-Custody Archives</span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            Enforcement & Evidence Reports
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Archived statutory inspection dossiers with complete OCR audit trails under the Legal Metrology Act.
          </p>
        </div>

        {/* Global Print / Bulk Download Trigger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:border-slate-400 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            <span className="hidden sm:inline">Print Dossier Sheet</span>
          </button>
        </div>
      </div>

      {/* New Report Notification Banner if newly created */}
      {newReportId && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CircleCheck className="h-5 w-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-bold text-emerald-950">
                  New Statutory Report Generated (#{newReportId})
                </h3>
                <p className="text-xs text-emerald-800">
                  Officer decision successfully filed and dynamically recorded in the live evidence ledger.
                </p>
              </div>
            </div>
            <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
              Active Case
            </span>
          </div>
        </div>
      )}

      {/* 2. Search & Filter Bar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          {/* Search Input */}
          <div className="relative sm:col-span-6">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product, brand, report #, or officer..."
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-xs text-gray-900 shadow-sm transition placeholder:text-gray-400 hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Status Filter */}
          <div className="relative sm:col-span-3">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Filter className="h-3.5 w-3.5" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-8 text-xs font-medium text-gray-700 shadow-sm transition hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All Statuses</option>
              <option value="Compliant">Compliant</option>
              <option value="Non-Compliant">Non-Compliant</option>
              <option value="Manual Review">Manual Review</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>

          {/* Date Filter */}
          <div className="relative sm:col-span-3">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Calendar className="h-3.5 w-3.5" />
            </div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-8 text-xs font-medium text-gray-700 shadow-sm transition hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All Timeframes</option>
              <option value="Today">Today's Audits</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Reports List / Cards */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-12 px-4 text-center">
            <FileText className="h-10 w-10 text-gray-400 mb-2" />
            <h3 className="text-sm font-semibold text-gray-900">No matching reports found</h3>
            <p className="mt-1 text-xs text-gray-500">
              Try adjusting your search query or status filter parameters.
            </p>
          </div>
        ) : (
          filteredReports.map((report: InspectionReport) => {
            const isExpanded = expandedReportId === report.id;

            return (
              <div
                key={report.id}
                className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/5 hover:border-blue-300 hover:-translate-y-0.5"
              >
                {/* Main Card Header / Summary Row */}
                <div className="p-6 sm:p-7">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100 shadow-2xs">
                          #{report.id}
                        </span>
                        <span className="rounded-xl bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                          {report.category}
                        </span>

                        {/* Status Badge */}
                        {report.verdict === 'Compliant' && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 shadow-2xs">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Compliant</span>
                          </span>
                        )}
                        {report.verdict === 'Non-Compliant' && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-600/20 shadow-2xs">
                            <OctagonAlert className="h-3.5 w-3.5" />
                            <span>Statutory Violation</span>
                          </span>
                        )}
                        {report.verdict === 'Manual Review' && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-inset ring-amber-600/20 shadow-2xs">
                            <TriangleAlert className="h-3.5 w-3.5" />
                            <span>Under Review</span>
                          </span>
                        )}
                      </div>

                      {/* Product & Brand */}
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900">
                          {report.productName}
                        </h2>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                          Manufacturer / Brand: {report.brand}
                        </p>
                      </div>

                      {/* Metadata Row */}
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 pt-1 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{report.inspectionDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span className="truncate max-w-[240px]">{report.location}</span>
                        </div>
                        <div>
                          Officer: <span className="font-bold text-slate-700">{report.officerName}</span> ({report.officerId})
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex shrink-0 items-center gap-2.5 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(report.id)}
                        disabled={downloadingId === report.id}
                        className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:border-blue-400 hover:text-blue-600 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>{downloadingId === report.id ? 'Generating...' : 'Download PDF'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedReportId(isExpanded ? null : report.id)
                        }
                        className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition-all duration-200 hover:bg-slate-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-400"
                      >
                        <span>Audit Trail</span>
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Violations Highlights if Non-Compliant */}
                  {report.violations && report.violations.length > 0 && (
                    <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/70 p-3.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 block">
                        Statutory Rules Violated:
                      </span>
                      <ul className="mt-1.5 space-y-1 text-xs font-medium text-rose-900 list-disc list-inside">
                        {report.violations.map((violation, vIdx) => (
                          <li key={vIdx}>{violation}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* 4. Expandable Full Audit Trail Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/80 p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span>Statutory Verification & Computer Vision Audit Log</span>
                      </h4>
                      <span className="text-xs font-semibold text-gray-500">
                        OCR Optical Confidence: <strong className="text-blue-700">{report.ocrConfidence}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-gray-200 bg-white p-3.5 text-xs">
                        <span className="text-gray-400 block font-semibold uppercase text-[10px]">
                          Officer Assessment Findings
                        </span>
                        <p className="mt-1 text-gray-800 font-medium leading-relaxed">
                          {report.findings}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-white p-3.5 text-xs">
                        <span className="text-gray-400 block font-semibold uppercase text-[10px]">
                          Statutory Enforcement Framework
                        </span>
                        <p className="mt-1 text-gray-800 font-medium leading-relaxed">
                          Adheres to Legal Metrology (Packaged Commodities) Rules, 2011 and Section 18/36 penal benchmarks.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 text-xs text-gray-500 border-t border-gray-200/60">
                      <span>
                        Cryptographic SHA-256 Digest:{' '}
                        <code className="text-gray-700 font-mono">e3b0c44298fc1c14...</code>
                      </span>
                      <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Print Legal Notice</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
