import { jsPDF } from 'jspdf';
import type { InspectionOcrAnalysis } from './legalMetrologyOcr';

interface OfficerSessionData {
  name: string;
  badgeId: string;
  region: string;
  role?: string;
}

/**
 * Safely retrieve active officer session data from localStorage
 */
export function getActiveSessionOfficer(): OfficerSessionData {
  try {
    const sessionStr =
      localStorage.getItem('activeSession') || localStorage.getItem('trinetra_officer');
    if (sessionStr) {
      const parsed = JSON.parse(sessionStr);
      if (parsed && typeof parsed === 'object') {
        return {
          name: String(parsed.name || 'Inspector Rajesh Varma'),
          badgeId: String(parsed.badgeId || 'INSP-GJ-2041'),
          region: String(parsed.region || 'Gujarat Circle'),
          role: String(parsed.role || 'Field Officer'),
        };
      }
    }
  } catch (e) {
    console.warn('Failed to parse activeSession for PDF export:', e);
  }

  return {
    name: 'Inspector Rajesh Varma',
    badgeId: 'INSP-GJ-2041',
    region: 'Gujarat Circle',
    role: 'Field Officer',
  };
}

/**
 * Generate and download an authentic, beautifully formatted Legal Metrology Inspection Report PDF
 */
export function generateInspectionPdf(
  analysis: InspectionOcrAnalysis,
  category: string = 'Food & Beverages',
  customOfficer?: Partial<OfficerSessionData>
): { success: boolean; filename?: string; error?: string } {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const activeOfficer = {
      ...getActiveSessionOfficer(),
      ...customOfficer,
    };

    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
    const margin = 14;
    const contentWidth = pageWidth - margin * 2; // 182mm
    let y = margin;

    // Helper for auto-page breaks
    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - margin - 12) {
        doc.addPage();
        y = margin;
        drawHeaderAccent();
      }
    };

    // Draw National Tricolor Top Accent Line
    const drawHeaderAccent = () => {
      const stripeW = pageWidth / 3;
      doc.setFillColor(255, 153, 51); // Saffron
      doc.rect(0, 0, stripeW, 2.5, 'F');
      doc.setFillColor(255, 255, 255); // White
      doc.rect(stripeW, 0, stripeW, 2.5, 'F');
      doc.setFillColor(19, 136, 8); // Green
      doc.rect(stripeW * 2, 0, stripeW, 2.5, 'F');
    };

    drawHeaderAccent();
    y += 2;

    // Official Government Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // Slate 600
    doc.text('GOVERNMENT OF INDIA • MINISTRY OF CONSUMER AFFAIRS', margin, y + 4);
    y += 8;

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text('Ministry of Legal Metrology - TriNetra Inspection Report', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(
      'Statutory Declaration Audit under Legal Metrology (Packaged Commodities) Rules, 2011',
      margin,
      y
    );
    y += 6;

    // Thin separator
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, y, margin + contentWidth, y);
    y += 4;

    // 1. Officer & Metadata Box
    const timestamp = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const reportDocketId = `TRN-${Date.now().toString().slice(-6)}`;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    // Left Column
    doc.text(`Dossier Number:`, margin + 4, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(reportDocketId, margin + 28, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.text(`Inspecting Officer:`, margin + 4, y + 12);
    doc.setFont('helvetica', 'normal');
    doc.text(`${activeOfficer.name} (${activeOfficer.role || 'Officer'})`, margin + 30, y + 12);

    doc.setFont('helvetica', 'bold');
    doc.text(`Officer Badge ID:`, margin + 4, y + 18);
    doc.setFont('helvetica', 'normal');
    doc.text(activeOfficer.badgeId, margin + 29, y + 18);

    // Right Column
    doc.setFont('helvetica', 'bold');
    doc.text(`Timestamp:`, margin + 100, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(timestamp, margin + 118, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.text(`Jurisdiction:`, margin + 100, y + 12);
    doc.setFont('helvetica', 'normal');
    doc.text(activeOfficer.region, margin + 119, y + 12);

    doc.setFont('helvetica', 'bold');
    doc.text(`Classification:`, margin + 100, y + 18);
    doc.setFont('helvetica', 'normal');
    doc.text(category, margin + 122, y + 18);

    y += 28;

    // 2. Final Compliance Verdict Banner (Legal Metrology (Packaged Commodities) Rules, 2011)
    const isCompliant = analysis.verdict === 'Compliant';

    if (isCompliant) {
      doc.setFillColor(236, 253, 245); // Emerald 50
      doc.setDrawColor(52, 211, 153); // Emerald 400
    } else {
      doc.setFillColor(255, 241, 242); // Rose 50
      doc.setDrawColor(248, 113, 113); // Rose 400
    }

    doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    if (isCompliant) {
      doc.setTextColor(6, 95, 70); // Emerald 800
      doc.text(`STATUTORY VERDICT: COMPLIANT (PASS)`, margin + 6, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(5, 150, 105);
      doc.text(
        'Verified under Legal Metrology (Packaged Commodities) Rules, 2011 • Confidence: ' +
          Math.round(analysis.confidence) +
          '%',
        margin + 6,
        y + 11.5
      );
    } else {
      doc.setTextColor(159, 18, 57); // Rose 800
      doc.text(`STATUTORY VERDICT: NON-COMPLIANT (FAIL)`, margin + 6, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(190, 18, 60);
      doc.text(
        `Failed under Legal Metrology (Packaged Commodities) Rules, 2011 • ${analysis.missingFieldsSummary || 'Missing required declarations'}`,
        margin + 6,
        y + 11.5
      );
    }

    y += 20;

    // 2B. Dedicated "Reasons for Failure" Section (prominently listed if failed)
    if (!isCompliant && ((analysis.missingFields && analysis.missingFields.length > 0) || (analysis.reasonsForFailure && analysis.reasonsForFailure.length > 0))) {
      const failureList =
        analysis.reasonsForFailure && analysis.reasonsForFailure.length > 0
          ? analysis.reasonsForFailure
          : analysis.missingFields.map((f) => `Mandatory field "${f}" was not detected in packaging artwork.`);

      const failureBoxH = 9 + failureList.length * 5.2;
      checkPageBreak(failureBoxH + 4);

      doc.setFillColor(254, 242, 242); // Rose 50
      doc.setDrawColor(239, 68, 68); // Rose 500
      doc.roundedRect(margin, y, contentWidth, failureBoxH, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(153, 27, 27); // Rose 900
      doc.text('Reasons for Failure (Legal Metrology Rules, 2011 Statutory Deficiencies):', margin + 4, y + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(185, 28, 28); // Rose 700

      let failY = y + 10.5;
      failureList.forEach((reason) => {
        doc.text(`[FAIL] ${reason}`, margin + 5, failY);
        failY += 4.8;
      });

      y += failureBoxH + 5;
    }

    // 3. Mandatory Statutory Declarations Audit Checklist
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Mandatory Statutory Declarations Audit (Rules, 2011)', margin, y);
    y += 5;

    analysis.rules.forEach((rule) => {
      checkPageBreak(22);

      const statusUpper = rule.status.toUpperCase();
      const isPass = rule.status === 'Compliant';

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, 'FD');

      // Rule Title & Status Tag
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`${rule.ruleNo}: ${rule.label}`, margin + 3, y + 5);

      if (isPass) {
        doc.setTextColor(16, 185, 129); // Emerald
      } else {
        doc.setTextColor(225, 29, 72); // Rose
      }
      doc.text(`[ ${statusUpper} ]`, margin + contentWidth - 28, y + 5);

      // Extracted Text Line
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      const snippet = doc.splitTextToSize(`Text: "${rule.extractedSnippet}"`, contentWidth - 8);
      doc.text(snippet, margin + 3, y + 9.5);

      // Finding
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Finding: ${rule.explanation}`, margin + 3, y + 14.5);

      y += 20;
    });

    // 4. Statutory Infractions Flagged (if any)
    if (analysis.violations && analysis.violations.length > 0) {
      checkPageBreak(18 + analysis.violations.length * 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(159, 18, 57);
      doc.text('Statutory Infractions & Grounds for Seizure (Legal Metrology Act, 2009):', margin, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);

      analysis.violations.forEach((v) => {
        doc.text(`• ${v}`, margin + 3, y);
        y += 4.5;
      });

      y += 2;
    }

    // 5. Raw Extracted Typography (Real OCR Scan Output)
    checkPageBreak(30);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Raw Extracted Optical Character Recognition (OCR) Text:', margin, y);
    y += 5;

    const rawSnippet = analysis.rawText.trim() || '[No printed typography identified]';
    const splitRaw = doc.splitTextToSize(rawSnippet, contentWidth - 6);

    const rawBoxHeight = Math.min(Math.max(splitRaw.length * 3.6 + 6, 14), 48);

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, rawBoxHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, rawBoxHeight, 1.5, 1.5, 'D');

    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);

    // Limit lines rendered inside the preview box so it fits nicely
    const printableLines = splitRaw.slice(0, 10);
    doc.text(printableLines, margin + 3, y + 4.5);

    y += rawBoxHeight + 6;

    // 6. Officer Signature & Digital Certification Block
    checkPageBreak(25);

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + contentWidth, y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('Authenticated & Digitally Sealed by:', margin, y);
    doc.text('Inspecting Officer Signature:', margin + 110, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('TriNetra Automated Metrology AI Engine', margin, y);
    doc.text(`Name: ${activeOfficer.name}`, margin + 110, y);
    y += 4;

    doc.text('Ministry of Consumer Affairs, New Delhi', margin, y);
    doc.text(`Badge: ${activeOfficer.badgeId} • ${activeOfficer.region}`, margin + 110, y);

    // Footer note
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'This document constitutes an official inspection dossier generated under Section 18 & 36 of the Legal Metrology Act, 2009.',
      margin,
      pageHeight - 6
    );

    // Save and download formatted PDF
    const filename = `TriNetra_Inspection_Report_${reportDocketId}.pdf`;
    doc.save(filename);

    return {
      success: true,
      filename,
    };
  } catch (err) {
    console.error('jsPDF generation failed:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown PDF generation error',
    };
  }
}

/**
 * Generate and download an authentic PDF for an existing inspection record
 */
export function generateSavedReportPdf(report: {
  id: string;
  productName: string;
  brand: string;
  category: string;
  inspectionDate: string;
  officerName: string;
  officerId: string;
  region?: string;
  location: string;
  verdict: 'Compliant' | 'Non-Compliant' | 'Manual Review';
  violations?: string[];
  findings: string;
  ocrConfidence: string;
}): { success: boolean; filename?: string; error?: string } {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - margin - 12) {
        doc.addPage();
        y = margin;
        drawHeaderAccent();
      }
    };

    const drawHeaderAccent = () => {
      const stripeW = pageWidth / 3;
      doc.setFillColor(255, 153, 51);
      doc.rect(0, 0, stripeW, 2.5, 'F');
      doc.setFillColor(255, 255, 255);
      doc.rect(stripeW, 0, stripeW, 2.5, 'F');
      doc.setFillColor(19, 136, 8);
      doc.rect(stripeW * 2, 0, stripeW, 2.5, 'F');
    };

    drawHeaderAccent();
    y += 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('GOVERNMENT OF INDIA • MINISTRY OF CONSUMER AFFAIRS', margin, y + 4);
    y += 8;

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Ministry of Legal Metrology - TriNetra Inspection Report', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Statutory Declaration Audit under Legal Metrology (Packaged Commodities) Rules, 2011',
      margin,
      y
    );
    y += 6;

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, y, margin + contentWidth, y);
    y += 4;

    // Metadata Card
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    doc.text('Dossier Number:', margin + 4, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(report.id, margin + 28, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.text('Inspecting Officer:', margin + 4, y + 12);
    doc.setFont('helvetica', 'normal');
    doc.text(report.officerName, margin + 30, y + 12);

    doc.setFont('helvetica', 'bold');
    doc.text('Officer Badge ID:', margin + 4, y + 18);
    doc.setFont('helvetica', 'normal');
    doc.text(report.officerId, margin + 29, y + 18);

    doc.setFont('helvetica', 'bold');
    doc.text('Inspection Date:', margin + 100, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(report.inspectionDate, margin + 122, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.text('Jurisdiction:', margin + 100, y + 12);
    doc.setFont('helvetica', 'normal');
    doc.text(report.region || report.location, margin + 119, y + 12);

    doc.setFont('helvetica', 'bold');
    doc.text('Classification:', margin + 100, y + 18);
    doc.setFont('helvetica', 'normal');
    doc.text(report.category, margin + 122, y + 18);

    y += 28;

    // Verdict Banner
    const isCompliant = report.verdict === 'Compliant';

    if (isCompliant) {
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(52, 211, 153);
    } else {
      doc.setFillColor(255, 241, 242);
      doc.setDrawColor(248, 113, 113);
    }

    doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    if (isCompliant) {
      doc.setTextColor(6, 95, 70);
      doc.text('STATUTORY VERDICT: COMPLIANT (PASS)', margin + 6, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(5, 150, 105);
      doc.text(
        'Verified under Legal Metrology (Packaged Commodities) Rules, 2011 • Confidence: ' +
          report.ocrConfidence,
        margin + 6,
        y + 11.5
      );
    } else {
      doc.setTextColor(159, 18, 57);
      doc.text('STATUTORY VERDICT: NON-COMPLIANT (FAIL)', margin + 6, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(190, 18, 60);
      doc.text(
        'Failed under Legal Metrology (Packaged Commodities) Rules, 2011 • Missing mandatory declarations',
        margin + 6,
        y + 11.5
      );
    }

    y += 20;

    // Reasons for Failure Section (if not compliant)
    if (!isCompliant) {
      const failureList =
        report.violations && report.violations.length > 0
          ? report.violations
          : ['One or more mandatory statutory declarations (MRP, Net Qty, Mfg/PKD Date, Customer Care) failed verification.'];

      const failureBoxH = 9 + failureList.length * 5.2;
      checkPageBreak(failureBoxH + 4);

      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(239, 68, 68);
      doc.roundedRect(margin, y, contentWidth, failureBoxH, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(153, 27, 27);
      doc.text('Reasons for Failure (Legal Metrology Rules, 2011 Statutory Deficiencies):', margin + 4, y + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(185, 28, 28);

      let failY = y + 10.5;
      failureList.forEach((reason) => {
        doc.text(`[FAIL] ${reason}`, margin + 5, failY);
        failY += 4.8;
      });

      y += failureBoxH + 5;
    }

    // Findings Section
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Statutory Audit Findings & Observations', margin, y);
    y += 5;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 22, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const splitFindings = doc.splitTextToSize(report.findings, contentWidth - 8);
    doc.text(splitFindings, margin + 4, y + 5.5);

    y += 26;

    // Violations Section
    if (report.violations && report.violations.length > 0) {
      checkPageBreak(18 + report.violations.length * 5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(159, 18, 57);
      doc.text('Statutory Infractions & Grounds for Seizure (Legal Metrology Act, 2009):', margin, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);

      report.violations.forEach((v) => {
        doc.text(`• ${v}`, margin + 3, y);
        y += 4.5;
      });

      y += 2;
    }

    // Signature Block
    checkPageBreak(25);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + contentWidth, y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('Authenticated & Digitally Sealed by:', margin, y);
    doc.text('Inspecting Officer Signature:', margin + 110, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('TriNetra Automated Metrology AI Engine', margin, y);
    doc.text(`Name: ${report.officerName}`, margin + 110, y);
    y += 4;

    doc.text('Ministry of Consumer Affairs, New Delhi', margin, y);
    doc.text(`Badge: ${report.officerId} • ${report.region || report.location}`, margin + 110, y);

    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'This document constitutes an official inspection dossier generated under Section 18 & 36 of the Legal Metrology Act, 2009.',
      margin,
      pageHeight - 6
    );

    const filename = `TriNetra_Inspection_Report_${report.id}.pdf`;
    doc.save(filename);

    return { success: true, filename };
  } catch (err) {
    console.error('jsPDF report download failed:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown PDF generation error',
    };
  }
}
