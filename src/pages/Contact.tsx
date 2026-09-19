import React, { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Send,
  CircleCheck,
  LifeBuoy,
  Award,
} from 'lucide-react';
import { useTriNetra } from '../context/TriNetraContext';

interface SupportTicket {
  id: string;
  name: string;
  badgeOrEmail: string;
  category: string;
  subject: string;
  message: string;
  createdAt: string;
}

export default function Contact() {
  const { officer } = useTriNetra();

  const [name, setName] = useState(officer?.name || '');
  const [badgeOrEmail, setBadgeOrEmail] = useState(officer?.badgeId || '');
  const [category, setCategory] = useState('Technical Bug / OCR Parsing');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [submittedTicket, setSubmittedTicket] = useState<SupportTicket | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please provide your name.');
      return;
    }
    if (!badgeOrEmail.trim()) {
      setErrorMessage('Please provide your Officer Badge ID or official email.');
      return;
    }
    if (!subject.trim()) {
      setErrorMessage('Please provide a subject line.');
      return;
    }
    if (!message.trim()) {
      setErrorMessage('Please describe the issue or inquiry.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const ticket: SupportTicket = {
        id: `TIC-LM-${Math.floor(1000 + Math.random() * 9000)}`,
        name: name.trim(),
        badgeOrEmail: badgeOrEmail.trim(),
        category,
        subject: subject.trim(),
        message: message.trim(),
        createdAt: new Date().toLocaleString(),
      };

      // Persist support ticket to localStorage
      try {
        const stored = localStorage.getItem('trinetra_support_tickets');
        const tickets: SupportTicket[] = stored ? JSON.parse(stored) : [];
        localStorage.setItem('trinetra_support_tickets', JSON.stringify([ticket, ...tickets]));
      } catch (err) {
        console.error('Failed to save ticket:', err);
      }

      setSubmittedTicket(ticket);
      setIsSubmitting(false);

      // Reset form fields
      setSubject('');
      setMessage('');
    }, 600);
  };

  return (
    <div className="space-y-16 py-4 sm:py-8 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* 1. Header */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-8 sm:p-14 text-white shadow-2xl">
        <div className="pointer-events-none absolute -top-16 right-0 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1 text-xs font-bold text-amber-300 backdrop-blur-md">
            <Award className="h-3.5 w-3.5 text-amber-400" />
            <span className="tracking-wider uppercase text-[10px]">OFFICER HELPDESK & REGIONAL DISPATCH</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Field Officer & Regional Controller Support
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Need optical terminal assistance, calibration support, or legal guidance for Rule 6
            statutory notice issuance under Section 36? Our dedicated technical desk is available 24/7.
          </p>
        </div>
      </section>

      {/* 2. Grid: Contact Info + Support Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Official Contact Channels */}
        <div className="space-y-6">
          {/* Card 1: National Help Desk */}
          <div className="group rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-7 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 transition-transform duration-300 group-hover:scale-110">
              <Phone className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
              National Metrology Hotline
            </h3>
            <p className="mt-1 text-xs text-slate-500 font-medium">Toll-free emergency field support line</p>
            <p className="mt-3 font-mono text-base font-black text-blue-600">1800-11-4000 / 1915</p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Mon - Sat, 08:00 AM - 08:00 PM IST</p>
          </div>

          {/* Card 2: Legal Advisory Email */}
          <div className="group rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-7 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4 transition-transform duration-300 group-hover:scale-110">
              <Mail className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-600 transition-colors">
              Statutory Legal Advisory
            </h3>
            <p className="mt-1 text-xs text-slate-500 font-medium">Notice drafting & compounding queries</p>
            <p className="mt-3 font-mono text-xs font-bold text-slate-800">
              metrology-support@nic.in
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Response turnaround within 4 business hours</p>
          </div>

          {/* Card 3: Central Headquarters */}
          <div className="group rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-7 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-purple-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 mb-4 transition-transform duration-300 group-hover:scale-110">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 group-hover:text-purple-600 transition-colors">
              Directorate of Legal Metrology
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed font-medium">
              Krishi Bhawan, Dr. Rajendra Prasad Road, New Delhi – 110001
            </p>
          </div>
        </div>

        {/* Right Column: Interactive Dispatch Ticket Form */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-7 sm:p-10 shadow-xl shadow-slate-900/5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Submit an Officer Support Ticket
            </h2>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              Tickets are routed directly to your Regional Senior Metrology Controller.
            </p>

            {/* Success Banner if ticket submitted */}
            {submittedTicket && (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-5 text-emerald-800 animate-in fade-in duration-200">
                <div className="flex items-start gap-3.5">
                  <CircleCheck className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold">Ticket Submitted Successfully!</h4>
                    <p className="mt-1 text-xs text-emerald-700">
                      Docket ID <span className="font-mono font-bold bg-emerald-100 px-2 py-0.5 rounded">{submittedTicket.id}</span> has
                      been dispatched and logged into your regional audit ledger.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSubmittedTicket(null)}
                      className="mt-3 text-xs font-bold text-emerald-800 underline hover:text-emerald-900"
                    >
                      Submit another ticket
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Officer Name */}
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    Officer / Inquirer Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50/50 py-3 px-4 text-xs font-medium text-slate-900 shadow-sm transition hover:border-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Badge ID / Email */}
                <div>
                  <label
                    htmlFor="contact-id"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    Badge ID / Gov Email
                  </label>
                  <input
                    id="contact-id"
                    type="text"
                    required
                    value={badgeOrEmail}
                    onChange={(e) => setBadgeOrEmail(e.target.value)}
                    placeholder="e.g. INSP-DL-402 or officer@nic.in"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50/50 py-3 px-4 text-xs font-medium text-slate-900 shadow-sm transition hover:border-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Inquiry Category */}
              <div>
                <label
                  htmlFor="contact-category"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Inquiry / Ticket Classification
                </label>
                <select
                  id="contact-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50/50 py-3 px-4 text-xs font-medium text-slate-900 shadow-sm transition hover:border-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Technical Bug / OCR Parsing">
                    Technical Bug / OCR Scanner Failure
                  </option>
                  <option value="Statutory Rule Interpretation">
                    Statutory Rule 2011 Interpretation Query
                  </option>
                  <option value="Hardware Camera Calibration">
                    Hardware Terminal / Camera Calibration
                  </option>
                  <option value="Evidentiary Notice & Seizure Memo">
                    Evidentiary Seizure Notice Assistance (Sec 36)
                  </option>
                  <option value="Officer Credentials & Access">
                    Officer Badge / Credentials Reset
                  </option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label
                  htmlFor="contact-subject"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Subject
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of the issue or inquiry"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50/50 py-3 px-4 text-xs font-medium text-slate-900 shadow-sm transition hover:border-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Detailed Description
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide sample barcode, product SKU, error message, or specific section query..."
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50/50 py-3 px-4 text-xs font-medium text-slate-900 shadow-sm transition hover:border-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-xl shadow-blue-500/25 transition-all duration-200 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/35 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  <span>{isSubmitting ? 'Transmitting Ticket...' : 'Dispatch Ticket to Controller'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
