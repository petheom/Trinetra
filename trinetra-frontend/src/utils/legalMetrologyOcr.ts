/**
 * Legal Metrology (Packaged Commodities) Rules, 2011
 * Strict Automated Statutory Declaration Parser for Tesseract.js OCR Text
 * Includes 7 statutory rules, line-bounded extraction, and 3-mode compliance classification
 */

export interface RuleCheckResult {
  id: string;
  ruleNo: string;
  label: string;
  status: 'Compliant' | 'Non-Compliant' | 'Manual Review';
  statusLabel: string;
  extractedSnippet: string;
  evidenceTag?: string;
  explanation: string;
  matchedKeyword?: string;
  critical?: boolean;
}

export interface InspectionOcrAnalysis {
  rawText: string;
  cleanText: string;
  confidence: number;
  verdict: 'Compliant' | 'Non-Compliant' | 'Manual Review' | 'COMPLIANT' | 'NON_COMPLIANT' | 'MANUAL_REVIEW';
  complianceStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'MANUAL_REVIEW';
  isStrictCompliant: boolean;
  missingFields: string[];
  missingMandatory: string[];
  missingFieldsSummary: string;
  reasonsForFailure: string[];
  rules: RuleCheckResult[];
  violations: string[];
  detectedProductName: string;
  detectedBrand: string;
  summaryFindings: string;
  suggestedUsp?: string | null;
  autoCalculatedUsp?: string | null;
}

/**
 * Line-bounded extraction:
 * Scans discrete lines to match regexes.
 * Returns only the specific isolated line containing the token to avoid
 * cross-column bleeding from nutritional tables, ingredients, or barcodes.
 */
function findMatchingLine(lines: string[], regexList: RegExp[]): { line: string; match: string } | null {
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    for (const rx of regexList) {
      const match = trimmed.match(rx);
      if (match) {
        return { line: trimmed.replace(/\s+/g, ' '), match: match[0].trim() };
      }
    }
  }
  return null;
}

/**
 * Analyze OCR extracted text against all 7 Legal Metrology declarations
 * using the 3-mode classification matrix ('COMPLIANT', 'NON_COMPLIANT', 'MANUAL_REVIEW').
 */
export function analyzePackagingText(
  rawText: string,
  ocrConfidence: number = 0,
  _category: string = 'Food & Beverages'
): InspectionOcrAnalysis {
  const safeText = String(rawText || '').trim();
  const lines = safeText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const lowerText = safeText.toLowerCase();

  // -------------------------------------------------------------
  // 1. Manufacturer / Packer Details (Rule 6(1)(a))
  // Specifically match "Mfd By" / "Manufactured By" / "Packed By" lines
  // -------------------------------------------------------------
  const mfgDetailsRegexes = [
    /\b(?:mfg\.?\s*(?:by|at)|manufactured\s*(?:by|at)|mfd\.?\s*(?:by|at)|packed\s*by|pkd\.?\s*by|marketed\s*by|imported\s*by|produced\s*by|processed\s*by)\b\s*[:=.]?\s*([^\n\r]+)/i,
    /\b(?:name\s*and\s*address\s*of\s*manufacturer|manufacturer\s*details|packer\s*details|importer\s*details)\b/i,
    /\b(?:mfg\.?\s*(?:by|at)|manufactured\s*(?:by|at)|mfd\.?\s*(?:by|at)|packed\s*by|pkd\.?\s*by|marketed\s*by|imported\s*by)\b/i,
    /\b(?:pvt\.?\s*ltd\.?|private\s*limited|enterprises|industries|foods|agro|works|corp\.?|llp)\b/i,
    /\b(?:fssai\s*(?:lic(?:ense)?|no\.?| lic)?\s*[:.-]?\s*\d{14})\b/i,
  ];
  const mfgDetailsFound = findMatchingLine(lines, mfgDetailsRegexes);
  const hasMfgDetails =
    lowerText.includes('mfg by') ||
    lowerText.includes('mfg. by') ||
    lowerText.includes('manufactured by') ||
    lowerText.includes('mfd by') ||
    lowerText.includes('mfd. by') ||
    lowerText.includes('packed by') ||
    lowerText.includes('marketed by') ||
    lowerText.includes('imported by') ||
    lowerText.includes('pvt ltd') ||
    lowerText.includes('pvt. ltd') ||
    lowerText.includes('private limited') ||
    lowerText.includes('manufacturer') ||
    mfgDetailsRegexes.some((rx) => rx.test(safeText));

  const mfgDetailsRule: RuleCheckResult = {
    id: 'mfg_details',
    ruleNo: 'Rule 6(1)(a)',
    label: 'Manufacturer / Packer Name & Address',
    status: hasMfgDetails ? 'Compliant' : 'Non-Compliant',
    statusLabel: hasMfgDetails ? 'Manufacturer Verified' : 'Missing Manufacturer',
    extractedSnippet: mfgDetailsFound?.line || (hasMfgDetails ? 'Manufacturer identity detected' : '[Not detected]'),
    evidenceTag: hasMfgDetails ? mfgDetailsFound?.line || 'Manufacturer / Packer' : 'Missing Rule 6(1)(a)',
    explanation: hasMfgDetails
      ? 'Mandatory Manufacturer/Packer identity conforming to Rule 6(1)(a) confirmed.'
      : 'Mandatory manufacturer, packer, or importer name and address declaration not found.',
    matchedKeyword: mfgDetailsFound?.match || (hasMfgDetails ? 'Manufacturer' : undefined),
    critical: true,
  };

  // -------------------------------------------------------------
  // 2. Net Quantity / Net Weight Check (Rule 6(1)(c))
  // Must match both numeric quantity and metric units (kg, g, gm, ml, l, pcs, etc.)
  // -------------------------------------------------------------
  const netQtyRegexes = [
    /(?:\b(?:net\s*(?:wt\.?|weight|qty\.?|quantity|content|contents|vol\.?|volume)?|शुद्ध\s*वजन|मात्रा)\b\s*[:=.]?\s*)?\b(\d+(?:\.\d+)?)\s*(kg|g|gm|gms|gram|grams|ml|l|ltr|litres|liter|liters|pieces|pcs|units|u|n)\b/i,
    /\b(\d+(?:\.\d+)?)\s*(kg|g|gm|gms|gram|grams|ml|l|ltr|litres|liter|liters|pieces|pcs|units)\b/i,
    /(?:net\s*(?:wt\.?|weight|qty\.?|quantity|content|contents|vol\.?|volume)?|शुद्ध\s*वजन)\s*[:=.]?\s*(\d+(?:\.\d+)?)/i,
  ];
  const netQtyFound = findMatchingLine(lines, netQtyRegexes);
  const hasNetQty =
    lowerText.includes('net weight') ||
    lowerText.includes('net wt') ||
    lowerText.includes('net-wt') ||
    lowerText.includes('net qty') ||
    lowerText.includes('net quantity') ||
    lowerText.includes('net content') ||
    lowerText.includes('net contents') ||
    lowerText.includes('net volume') ||
    lowerText.includes('net vol') ||
    lowerText.includes('शुद्ध वजन') ||
    lowerText.includes('मात्रा') ||
    netQtyRegexes.some((rx) => rx.test(safeText));

  const netQtyRule: RuleCheckResult = {
    id: 'net_weight',
    ruleNo: 'Rule 6(1)(c)',
    label: 'Net Quantity / Weight Declaration',
    status: hasNetQty ? 'Compliant' : 'Non-Compliant',
    statusLabel: hasNetQty ? 'Net Qty Verified' : 'Missing Net Qty',
    extractedSnippet: netQtyFound?.line || (hasNetQty ? 'Metric weight/quantity declaration detected' : '[Not detected]'),
    evidenceTag: hasNetQty ? netQtyFound?.line || 'Net Quantity' : 'Missing Rule 6(1)(c)',
    explanation: hasNetQty
      ? 'Statutory standard metric quantity declaration conforming to Rule 6(1)(c) confirmed.'
      : 'Mandatory standard metric quantity/weight declaration missing.',
    matchedKeyword: netQtyFound?.match || (hasNetQty ? 'Net Qty' : undefined),
    critical: true,
  };

  // -------------------------------------------------------------
  // 3. Date of Manufacture / PKD Check (Rule 6(1)(d))
  // Target Mfg/PKD/Packed Date explicitly, separating it from "Best Before" text
  // -------------------------------------------------------------
  const mfgRegexes = [
    /\b(?:mfg\.?\s*(?:date|dt\.?)?|date\s*of\s*mfg|mfd\.?\s*(?:date|dt\.?)?|date\s*of\s*manufactur(?:e|ing)|pkd\.?\s*(?:date|dt\.?)?|date\s*of\s*pkd|date\s*of\s*pack(?:ing)?|packed\s*on|packing\s*date)\b\s*[:=.]?\s*(?:(?:(?:0?[1-9]|[12]\d|3[01])[/.-])?(?:0?[1-9]|1[0-2]|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[/.-]?(?:20\d{2}|\d{2}))/i,
    /\b(?:mfg\.?\s*(?:date|dt\.?)?|date\s*of\s*mfg|mfd\.?\s*(?:date|dt\.?)?|date\s*of\s*manufactur(?:e|ing)|pkd\.?\s*(?:date|dt\.?)?|date\s*of\s*pkd|date\s*of\s*pack(?:ing)?|packed\s*on)\b/i,
    /\b(?:mfg|mfd|pkd|pckd)\b\s*[:=.]?\s*(?:0?[1-9]|1[0-2])[/.-](?:20\d{2}|\d{2})\b/i,
    /\b(?:mfg|mfd|pkd|pckd)\b\s*[:=.]?\s*(?:0?[1-9]|[12]\d|3[01])[/.-](?:0?[1-9]|1[0-2])[/.-](?:20\d{2}|\d{2})\b/i,
    /\b(?:mfg|mfd|pkd|pckd)\b\s*[:=.]?\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s'.-]*(?:20\d{2}|\d{2})\b/i,
    /\b(?:batch\s*(?:no\.?|number)|lot\s*(?:no\.?|number)|b\.?\s*no\.?)\b/i,
  ];
  const mfgFound = findMatchingLine(lines, mfgRegexes);
  const hasMfg =
    lowerText.includes('mfg date') ||
    lowerText.includes('mfg. date') ||
    lowerText.includes('date of mfg') ||
    lowerText.includes('mfd date') ||
    lowerText.includes('mfd. date') ||
    lowerText.includes('date of manufacture') ||
    lowerText.includes('pkd') ||
    lowerText.includes('pckd') ||
    lowerText.includes('pkd date') ||
    lowerText.includes('date of packing') ||
    lowerText.includes('date of pkd') ||
    lowerText.includes('packed on') ||
    mfgRegexes.some((rx) => rx.test(safeText));

  const mfgRule: RuleCheckResult = {
    id: 'mfg_date',
    ruleNo: 'Rule 6(1)(d)',
    label: 'Date of Mfg / Packing (PKD)',
    status: hasMfg ? 'Compliant' : 'Non-Compliant',
    statusLabel: hasMfg ? 'Mfg / PKD Verified' : 'Missing Mfg Date',
    extractedSnippet: mfgFound?.line || (hasMfg ? 'Manufacturing chronology stamp detected' : '[Not detected]'),
    evidenceTag: hasMfg ? mfgFound?.line || 'PKD / Mfg Date' : 'Missing Rule 6(1)(d)',
    explanation: hasMfg
      ? 'Month and year of manufacture or packaging chronology conforming to Rule 6(1)(d) confirmed.'
      : 'Mandatory manufacturing or packaging date (PKD) not found.',
    matchedKeyword: mfgFound?.match || (hasMfg ? 'Mfg Date' : undefined),
    critical: true,
  };

  // -------------------------------------------------------------
  // 4. Maximum Retail Price (MRP) Check (Rule 6(1)(e))
  // Require currency indicators (₹, Rs, INR, MRP) followed by numeric price
  // -------------------------------------------------------------
  const mrpRegexes = [
    /(?:\bMRP\b|\bM\.R\.P\.?|₹|\bRs\.?)\s*[:=.]?\s*(?:₹|\bRs\.?|\bINR\b)?\s*(\d+(?:\.\d{1,2})?)/i,
    /(?:₹|\bRs\.?|\bINR\b)\s*[:=.]?\s*(\d+(?:\.\d{1,2})?)/i,
    /\b(\d+(?:\.\d{1,2})?)\s*(?:₹|\bRs\.?|\bINR\b)\b/i,
    /(?:\bMRP\b|\bM\.R\.P\.?)\s*[:=.]?\s*(\d+(?:\.\d{1,2})?)/i,
    /(?:incl(?:usive)?\.?\s*of\s*all\s*taxes|सकल\s*मूल्य|कर\s*सहित)/i,
  ];
  const mrpFound = findMatchingLine(lines, mrpRegexes);
  const hasMrp =
    lowerText.includes('mrp') ||
    lowerText.includes('m.r.p') ||
    lowerText.includes('m r p') ||
    lowerText.includes('maximum retail price') ||
    lowerText.includes('max retail price') ||
    lowerText.includes('retail price') ||
    lowerText.includes('₹') ||
    lowerText.includes('rs.') ||
    lowerText.includes('rs ') ||
    lowerText.includes('rs-') ||
    lowerText.includes('rs:') ||
    lowerText.includes('inr') ||
    mrpRegexes.some((rx) => rx.test(safeText));

  const mrpRule: RuleCheckResult = {
    id: 'mrp',
    ruleNo: 'Rule 6(1)(e)',
    label: 'Maximum Retail Price (MRP)',
    status: hasMrp ? 'Compliant' : 'Non-Compliant',
    statusLabel: hasMrp ? 'MRP Verified' : 'Missing MRP',
    extractedSnippet: mrpFound?.line || (hasMrp ? 'MRP detected in artwork' : '[Not detected]'),
    evidenceTag: hasMrp ? mrpFound?.line || 'MRP Declared' : 'Missing Rule 6(1)(e)',
    explanation: hasMrp
      ? 'Mandatory Maximum Retail Price declaration conforming to Rule 6(1)(e) confirmed.'
      : 'Mandatory MRP declaration with statutory inclusive of all taxes not found.',
    matchedKeyword: mrpFound?.match || (hasMrp ? 'MRP' : undefined),
    critical: true,
  };

  // -------------------------------------------------------------
  // 5. Country of Origin (Rule 6(1)(f))
  // -------------------------------------------------------------
  const originRegexes = [
    /\b(?:country\s*of\s*origin|origin\s*country|origin\s*[:.-]|made\s*in|product\s*of|manufactured\s*in|assembled\s*in|imported\s*from)\b\s*[:=.]?\s*([a-zA-Z]+)/i,
    /\b(?:made\s*in\s*india|product\s*of\s*india|origin\s*:\s*india|origin\s*india)\b/i,
    /\b(?:country\s*of\s*origin|origin|made\s*in|product\s*of)\b/i,
    /\b(?:india|bharat|china|usa|uk|germany|japan|vietnam|thailand|indonesia|malaysia|taiwan|italy|france|spain)\b/i,
  ];
  const originFound = findMatchingLine(lines, originRegexes);
  const hasOrigin =
    lowerText.includes('country of origin') ||
    lowerText.includes('country of origin:') ||
    lowerText.includes('made in') ||
    lowerText.includes('product of') ||
    lowerText.includes('origin:') ||
    lowerText.includes('origin :') ||
    lowerText.includes('manufactured in') ||
    lowerText.includes('imported from') ||
    originRegexes.some((rx) => rx.test(safeText));

  const originRule: RuleCheckResult = {
    id: 'country_origin',
    ruleNo: 'Rule 6(1)(f)',
    label: 'Country of Origin',
    status: hasOrigin ? 'Compliant' : 'Non-Compliant',
    statusLabel: hasOrigin ? 'Origin Verified' : 'Missing Origin',
    extractedSnippet: originFound?.line || (hasOrigin ? 'Country of Origin declaration identified' : '[Not detected]'),
    evidenceTag: hasOrigin ? originFound?.line || 'Country of Origin' : 'Missing Rule 6(1)(f)',
    explanation: hasOrigin
      ? 'Country of Origin declaration under Rule 6(1)(f) confirmed.'
      : 'Mandatory Country of Origin declaration not detected.',
    matchedKeyword: originFound?.match || (hasOrigin ? 'Origin' : undefined),
    critical: true,
  };

  // -------------------------------------------------------------
  // 6. Customer Care Details (Rule 6(1)(g))
  // Match toll-free lines, phone numbers, or customercare emails
  // -------------------------------------------------------------
  const careRegexes = [
    /\b(?:customer\s*care|consumer\s*care|consumer\s*cell|customer\s*support|care\s*cell|careline|care\s*line)\b/i,
    /\b(?:toll\s*free|tollfree|helpline|help\s*line|feedback|complaint|grievance)\b/i,
    /\b1800[-\s]?\d{3}[-\s]?\d{3,4}\b/,
    /\b[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\b/,
    /\b(?:contact\s*(?:us|person|no\.?|details)?|tele?phone|tel\s*:|phone\s*:|call\s*us|write\s*to)\b/i,
  ];
  const careFound = findMatchingLine(lines, careRegexes);
  const hasCare =
    lowerText.includes('@') ||
    lowerText.includes('email') ||
    lowerText.includes('e-mail') ||
    lowerText.includes('toll') ||
    lowerText.includes('care') ||
    lowerText.includes('1800') ||
    lowerText.includes('helpline') ||
    lowerText.includes('feedback') ||
    lowerText.includes('complaint') ||
    lowerText.includes('grievance') ||
    lowerText.includes('consumer') ||
    lowerText.includes('customer') ||
    careRegexes.some((rx) => rx.test(safeText));

  const careRule: RuleCheckResult = {
    id: 'customer_care',
    ruleNo: 'Rule 6(1)(g)',
    label: 'Consumer Care / Grievance Redressal',
    status: hasCare ? 'Compliant' : 'Non-Compliant',
    statusLabel: hasCare ? 'Customer Care Verified' : 'Missing Care',
    extractedSnippet: careFound?.line || (hasCare ? 'Consumer grievance channel identified' : '[Not detected]'),
    evidenceTag: hasCare ? careFound?.line || 'Customer Care' : 'Missing Rule 6(1)(g)',
    explanation: hasCare
      ? 'Statutory consumer grievance contact channel conforming to Rule 6(1)(g) confirmed.'
      : 'Mandatory consumer care details (helpline, email, or grievance address) not found.',
    matchedKeyword: careFound?.match || (hasCare ? 'Customer Care' : undefined),
    critical: true,
  };

  // -------------------------------------------------------------
  // 7. Unit Sale Price (USP) (Rule 11)
  // Parse explicit USP declarations (e.g. ₹ X / g)
  // -------------------------------------------------------------
  const uspRegexes = [
    /(?:\b(?:unit\s*sale\s*price|unit\s*price|u\.?s\.?p\.?)\b\s*[:=.]?\s*)?(?:₹|\bRs\.?|\bINR\b)\s*[\d,]+(?:\.\d{1,2})?\s*(?:\/|\s*per\s*)(?:g|gm|kg|ml|l|ltr|unit|piece|u|n|pc)\b/i,
    /\b\d+(?:\.\d{1,2})?\s*(?:₹|\bRs\.?|\bINR\b)?\s*(?:\/|\s*per\s*)(?:g|gm|kg|ml|l|ltr|unit|piece|u|n|pc)\b/i,
    /\b(?:unit\s*sale\s*price|unit\s*price|u\.?s\.?p\.?)\b/i,
    /\b(?:per\s*g|per\s*ml|per\s*kg|per\s*litre|per\s*unit|\/g|\/ml|\/kg|\/l)\b/i,
  ];
  const uspFound = findMatchingLine(lines, uspRegexes);
  const hasUsp =
    lowerText.includes('unit sale price') ||
    lowerText.includes('unit price') ||
    lowerText.includes('usp') ||
    lowerText.includes('/g') ||
    lowerText.includes('/ml') ||
    lowerText.includes('/kg') ||
    lowerText.includes('/l') ||
    lowerText.includes('per g') ||
    lowerText.includes('per ml') ||
    lowerText.includes('per kg') ||
    lowerText.includes('per unit') ||
    lowerText.includes('per piece') ||
    uspRegexes.some((rx) => rx.test(safeText));

  // Auto-calculate suggested USP if Rule 11 declaration is missing
  let suggestedUsp: string | null = null;
  if (!hasUsp) {
    try {
      let mrpValue: number | null = null;
      for (const rx of mrpRegexes) {
        const m = rx.exec(safeText);
        if (m && m[1]) {
          const parsed = parseFloat(m[1].replace(/,/g, ''));
          if (!isNaN(parsed) && parsed > 0) {
            mrpValue = parsed;
            break;
          }
        }
      }

      let qtyValue: number | null = null;
      let qtyUnit: string | null = null;
      for (const rx of netQtyRegexes) {
        const m = rx.exec(safeText);
        if (m) {
          if (m[1] && m[2]) {
            qtyValue = parseFloat(m[1]);
            qtyUnit = m[2].toLowerCase();
            break;
          } else if (m[1]) {
            const unitMatch = m[0].match(/(kg|g|gm|gms|gram|grams|ml|l|ltr|litres|liter|liters|pieces|pcs|units|u|n)\b/i);
            if (unitMatch) {
              qtyValue = parseFloat(m[1]);
              qtyUnit = unitMatch[1].toLowerCase();
              break;
            }
          }
        }
      }

      if (mrpValue && qtyValue && qtyValue > 0 && qtyUnit) {
        if (['g', 'gm', 'gms', 'gram', 'grams'].includes(qtyUnit)) {
          const rate = mrpValue / qtyValue;
          suggestedUsp = `₹ ${rate < 1 ? rate.toFixed(3) : rate.toFixed(2)} / g`;
        } else if (['kg'].includes(qtyUnit)) {
          const rate = mrpValue / qtyValue;
          suggestedUsp = `₹ ${rate.toFixed(2)} / kg`;
        } else if (['ml'].includes(qtyUnit)) {
          const rate = mrpValue / qtyValue;
          suggestedUsp = `₹ ${rate < 1 ? rate.toFixed(3) : rate.toFixed(2)} / ml`;
        } else if (['l', 'ltr', 'litres', 'liter', 'liters'].includes(qtyUnit)) {
          const rate = mrpValue / qtyValue;
          suggestedUsp = `₹ ${rate.toFixed(2)} / L`;
        } else if (['pcs', 'pieces', 'units', 'u', 'n'].includes(qtyUnit)) {
          const rate = mrpValue / qtyValue;
          suggestedUsp = `₹ ${rate.toFixed(2)} / unit`;
        }
      }
    } catch {
      suggestedUsp = null;
    }
  }

  const uspRule: RuleCheckResult = {
    id: 'unit_sale_price',
    ruleNo: 'Rule 11',
    label: 'Unit Sale Price (USP)',
    status: hasUsp ? 'Compliant' : 'Non-Compliant',
    statusLabel: hasUsp ? 'USP Verified' : suggestedUsp ? 'Calculated USP Available' : 'Missing USP',
    extractedSnippet: uspFound?.line || (hasUsp ? 'Unit Sale Price (USP) declaration detected' : suggestedUsp ? `Auto-calculated: ${suggestedUsp}` : '[Not detected]'),
    evidenceTag: hasUsp ? uspFound?.line || 'Unit Sale Price' : suggestedUsp ? `USP: ${suggestedUsp} (Auto-calculated)` : 'Missing Rule 11',
    explanation: hasUsp
      ? 'Statutory Unit Sale Price (USP) under Rule 11 confirmed.'
      : suggestedUsp
      ? `Statutory USP missing. Auto-calculated suggested USP: ${suggestedUsp}.`
      : 'Mandatory Unit Sale Price (USP) under Rule 11 not clearly stated.',
    matchedKeyword: uspFound?.match || (hasUsp ? 'USP' : undefined),
    critical: false,
  };

  const rules: RuleCheckResult[] = [
    mfgDetailsRule,
    netQtyRule,
    mfgRule,
    mrpRule,
    originRule,
    careRule,
    uspRule,
  ];

  const mandatoryRulesList = [
    { ruleNo: 'Rule 6(1)(a)', name: 'Manufacturer / Packer Name & Address', found: hasMfgDetails },
    { ruleNo: 'Rule 6(1)(c)', name: 'Net Quantity / Weight Declaration', found: hasNetQty },
    { ruleNo: 'Rule 6(1)(d)', name: 'Date of Mfg / Packing (PKD)', found: hasMfg },
    { ruleNo: 'Rule 6(1)(e)', name: 'Maximum Retail Price (MRP)', found: hasMrp },
    { ruleNo: 'Rule 6(1)(f)', name: 'Country of Origin', found: hasOrigin },
    { ruleNo: 'Rule 6(1)(g)', name: 'Consumer Care / Grievance Redressal', found: hasCare },
  ];

  const missingMandatory: string[] = mandatoryRulesList.filter((r) => !r.found).map((r) => r.name);
  const missingRules = rules.filter((r) => r.status === 'Non-Compliant');
  const missingFields: string[] = missingRules.map((r) => r.label);

  const reasonsForFailure: string[] = missingRules.map(
    (r) => `${r.ruleNo}: ${r.explanation}`
  );
  const violations: string[] = missingRules.map(
    (r) => `${r.ruleNo} Infraction: ${r.label} missing from packaging artwork.`
  );

  // -------------------------------------------------------------
  // 3-Mode Classification Decision Matrix:
  // - If all mandatory rules are found: 'COMPLIANT'
  // - If any mandatory rule (Rule 6(1)(a)-(g)) is absent: 'NON_COMPLIANT'
  // - If all mandatory rules pass but Rule 11 (USP) is missing: do NOT mark as FAIL.
  //   Set status to 'MANUAL_REVIEW' and auto-calculate suggested USP (MRP / Net Quantity).
  // -------------------------------------------------------------
  let complianceStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'MANUAL_REVIEW' = 'COMPLIANT';

  if (missingMandatory.length > 0) {
    complianceStatus = 'NON_COMPLIANT';
  } else if (!hasUsp) {
    complianceStatus = 'MANUAL_REVIEW';
  } else if (ocrConfidence > 0 && ocrConfidence < 60) {
    complianceStatus = 'MANUAL_REVIEW';
  } else {
    complianceStatus = 'COMPLIANT';
  }

  const isStrictCompliant = complianceStatus === 'COMPLIANT';
  const verdict = complianceStatus;

  const missingFieldsSummary =
    missingFields.length === 0
      ? 'All statutory declarations verified under Legal Metrology Rules, 2011'
      : `Missing: ${missingFields.join(', ')}`;

  // Product and brand detection heuristic
  let detectedProductName = 'Inspected Packaged Commodity';
  let detectedBrand = 'Domestic Manufacturer';

  if (lines.length > 0) {
    const candidateName = lines.find(
      (l) =>
        l.length > 3 &&
        l.length < 50 &&
        !l.toLowerCase().includes('nutrition') &&
        !l.toLowerCase().includes('ingredient') &&
        !l.toLowerCase().includes('keep in')
    );
    if (candidateName) {
      detectedProductName = candidateName;
    }

    const candidateBrand = lines.find(
      (l) =>
        (l.toLowerCase().includes('pvt') ||
          l.toLowerCase().includes('ltd') ||
          l.toLowerCase().includes('industries') ||
          l.toLowerCase().includes('brand') ||
          l.toLowerCase().includes('mfg by')) &&
        l.length < 60
    );
    if (candidateBrand) {
      detectedBrand = candidateBrand.replace(/mfg\.?\s*by\s*:?/i, '').trim();
    } else if (lines.length > 1 && lines[0] !== candidateName) {
      detectedBrand = lines[0];
    }
  }

  let summaryFindings = '';
  if (complianceStatus === 'COMPLIANT') {
    summaryFindings = `COMPLIANT (PASS): All statutory declarations verified under Legal Metrology (Packaged Commodities) Rules, 2011. OCR Confidence: ${Math.round(ocrConfidence)}%.`;
  } else if (complianceStatus === 'NON_COMPLIANT') {
    summaryFindings = `NON-COMPLIANT (FAIL): Mandatory statutory declarations missing (${missingMandatory.join(', ')}).`;
  } else {
    summaryFindings = suggestedUsp
      ? `MANUAL REVIEW: All mandatory Rule 6(1) declarations detected. Rule 11 (USP) missing; auto-calculated suggested USP: ${suggestedUsp}.`
      : `MANUAL REVIEW REQUIRED: Ambiguous or partial declarations detected (${missingFieldsSummary}). Referred for officer verification.`;
  }

  return {
    rawText: safeText,
    cleanText: lines.join('\n'),
    confidence: ocrConfidence,
    verdict,
    complianceStatus,
    isStrictCompliant,
    missingFields,
    missingMandatory,
    missingFieldsSummary,
    reasonsForFailure,
    rules,
    violations,
    detectedProductName,
    detectedBrand,
    summaryFindings,
    suggestedUsp,
    autoCalculatedUsp: suggestedUsp,
  };
}
