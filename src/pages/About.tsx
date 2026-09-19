import { Link } from 'react-router-dom';
import {
  Scale,
  Languages,
  Lock,
  Cpu,
  Building,
  ArrowRight,
  Award,
} from 'lucide-react';

export default function About() {
  const rules = [
    {
      rule: 'Rule 6(1)(a)',
      title: 'Manufacturer & Packer Identity',
      desc: 'Mandatory declaration of the complete corporate name and physical street address (with PIN code) of the manufacturer, packer, or importer.',
    },
    {
      rule: 'Rule 6(1)(b)',
      title: 'Generic Commodity Nomenclature',
      desc: 'Common or generic name of the commodity contained in the package, prominently displayed without deceptive brand embellishments.',
    },
    {
      rule: 'Rule 6(1)(c)',
      title: 'Standard Net Quantity',
      desc: 'Net mass, volume, or count expressed strictly in standard SI units (kg, g, L, ml, N) with minimum mandated font sizes based on package area.',
    },
    {
      rule: 'Rule 6(1)(d)',
      title: 'Manufacturing & Packaging Date',
      desc: 'Clear month and year of manufacture or pre-packaging, preventing post-dated batches or illegible thermal dot-matrix printing.',
    },
    {
      rule: 'Rule 6(1)(e)',
      title: 'Maximum Retail Price (MRP) & USP',
      desc: 'Statutory retail price inclusive of all taxes, accompanied by the mandatory Unit Sale Price (USP per g/ml) under 2021 amended statutory rules.',
    },
    {
      rule: 'Rule 6(1)(f)',
      title: 'Consumer Redressal Helpline',
      desc: 'Designated contact officer name, toll-free helpline telephone number, official email, and postal address for consumer grievance resolution.',
    },
  ];

  return (
    <div className="space-y-16 py-4 sm:py-8 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* 1. Header Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-8 sm:p-14 text-white shadow-2xl">
        <div className="pointer-events-none absolute -top-16 right-0 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1 text-xs font-bold text-amber-300 backdrop-blur-md">
            <Award className="h-3.5 w-3.5 text-amber-400" />
            <span className="tracking-wider uppercase text-[10px]">STATUTORY ENFORCEMENT FRAMEWORK</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Empowering Field Enforcement with Intelligent Metrology
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            <strong className="text-white font-bold">TriNetra</strong> is an advanced optical computer-vision
            and statutory compliance platform engineered for field officers operating under the{' '}
            <span className="text-cyan-300 font-semibold">
              Legal Metrology (Packaged Commodities) Rules, 2011
            </span>{' '}
            and the <span className="text-blue-200 font-semibold">Legal Metrology Act, 2009</span>.
          </p>
        </div>
      </section>

      {/* 2. Mission & Vision */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="group rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-7 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-300">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-5 transition-transform duration-300 group-hover:scale-110">
            <Scale className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
            Our Enforcement Mission
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            Eliminate deceptive packaging, dual-pricing tampering, obscured manufacturing stamps,
            and missing mandatory declarations across retail and wholesale supply chains in India.
            We equip ground-level officers with instantaneous optical verification.
          </p>
        </div>

        <div className="group rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-7 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-300">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-5 transition-transform duration-300 group-hover:scale-110">
            <Cpu className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
            AI-Powered Optical Automation
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            Traditional manual inspections with calipers and magnifying lenses are slow and error-prone.
            TriNetra leverages real-time OCR, bounding box semantic segmentation, and multilingual Indic
            NLP to evaluate packaging text in seconds.
          </p>
        </div>
      </section>

      {/* 3. The 2011 Legal Metrology Rules Checklist */}
      <section className="space-y-8">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Core Statutory Checklist: Packaged Commodities Rules, 2011
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            TriNetra's automated engine validates every package against Rule 6 mandates before generating
            inspection findings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rules.map((item, idx) => (
            <div
              key={idx}
              className="group rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-6 shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-xl hover:-translate-y-1"
            >
              <span className="inline-block rounded-xl bg-blue-50 px-3 py-1 text-xs font-mono font-bold text-blue-700 mb-3 border border-blue-100">
                {item.rule}
              </span>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {item.title}
              </h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Technological Pillars */}
      <section className="rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-8 sm:p-12 shadow-md space-y-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Key Technological Innovations</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
              <Languages className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Multilingual Ingestion</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Full support for bilingual packaging mandates in Devanagari Hindi and Latin English,
              normalizing units like "शुद्ध वजन" and "Net Wt".
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 shadow-sm">
              <Lock className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">SHA-256 Audit Trail</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Every inspection docket is hashed with SHA-256 cryptographic digests, ensuring evidence
              integrity for Section 36 compounding proceedings.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm">
              <Building className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Jurisdictional Tracking</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Dynamic regional partitioning allows circles, zones, and state headquarters to collaborate
              without cross-contaminating field ledgers.
            </p>
          </div>
        </div>
      </section>

      {/* 5. CTA Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-8 text-white shadow-2xl">
        <div className="space-y-1">
          <h4 className="font-black text-lg sm:text-xl">Ready to start packaging verification?</h4>
          <p className="text-xs text-slate-300">
            Log in to your field terminal to run instant packaging computer-vision scans.
          </p>
        </div>
        <Link
          to="/scanner"
          className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-900 shadow-md transition-all duration-200 hover:bg-blue-50 hover:scale-105 active:scale-95 shrink-0"
        >
          <span>Open Scanner Terminal</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
