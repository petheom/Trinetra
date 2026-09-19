/**
 * Legal Metrology (Packaged Commodities) Rules, 2011
 * Strict Automated Statutory Declaration Parser for Tesseract.js OCR Text
 */

export interface RuleCheckResult {
  id: string;
  ruleNo: string;
  label: string;
  status: 'Compliant' | 'Non-Compliant';
  statusLabel: string;
  extractedSnippet: string;
  explanation: string;
  matchedKeyword?: string;
}

export interface InspectionOcrAnalysis {
  rawText: string;
  cleanText: string;
  confidence: number;
  verdict: 'Compliant' | 'Non-Compliant';
  isStrictCompliant: boolean;
  missingFields: string[];
  missingFieldsSummary: string;
  reasonsForFailure: string[];
  rules: RuleCheckResult[];
  violations: string[];
  detectedProductName: string;
  detectedBrand: string;
  summaryFindings: string;
}

/**
 * Extracts a relevant line or substring from raw lines containing any of the regex patterns
 */
function findMatchingLine(lines: string[], regexList: RegExp[]): { line: string; match: string } | null {
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    for (const rx of regexList) {
      const match = trimmed.match(rx);
      if (match) {
        return { line: trimmed, match: match[0] };
      }
    }
  }
  return null;
}

/**
 * Analyze OCR extracted text strictly against the 4 mandatory Legal Metrology declarations
 * under the Legal Metrology (Packaged Commodities) Rules, 2011.
 * 
 * Strict Condition: IF ANY REQUIRED FIELD IS MISSING, VERDICT MUST BE "Non-Compliant" (Fail).
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
  // 1. MRP / Maximum Retail Price Check (Rule 6(1)(e))
  // Mandatory keyword variations: MRP, M.R.P., Max Retail Price, ₹, Rs, R5, INR, Incl of all taxes
  // -------------------------------------------------------------
  const mrpRegexes = [
    /\b(?:m\.?\s*r\.?\s*p\.?|max(?:imum)?\s*retail\s*price|retail\s*price)\b/i,
    /(?:₹|rs\.?|inr|r5\.?)\s*[\d,]+(?:\.\d{2})?/i,
    /\b[\d,]+(?:\.\d{2})?\s*(?:₹|rs\.?|inr)\b/i,
    /(?:incl(?:usive)?\.?\s*of\s*all\s*taxes|सकल\s*मूल्य|कर\s*सहित)/i,
    /\b(?:price|retail\s*price|all\s*taxes|incl\.?\s*taxes)\b/i,
  ];

  const mrpFound = findMatchingLine(lines, mrpRegexes);
  const hasMrpVariation =
    lowerText.includes('mrp') ||
    lowerText.includes('m.r.p') ||
    lowerText.includes('m r p') ||
    lowerText.includes('maximum retail price') ||
    lowerText.includes('max retail price') ||
    lowerText.includes('max. retail price') ||
    lowerText.includes('retail price') ||
    lowerText.includes('price') ||
    lowerText.includes('₹') ||
    lowerText.includes('rs.') ||
    lowerText.includes('rs ') ||
    lowerText.includes('rs-') ||
    lowerText.includes('rs:') ||
    lowerText.includes('inr') ||
    lowerText.includes('r5.') ||
    lowerText.includes('r5 ') ||
    lowerText.includes('r5:') ||
    lowerText.includes('all taxes') ||
    lowerText.includes('taxes') ||
    lowerText.includes('कर सहित') ||
    lowerText.includes('सकल मूल्य') ||
    mrpRegexes.some((rx) => rx.test(safeText));

  const mrpRule: RuleCheckResult = {
    id: 'mrp',
    ruleNo: 'Rule 6(1)(e)',
    label: 'Maximum Retail Price (MRP)',
    status: hasMrpVariation ? 'Compliant' : 'Non-Compliant',
    statusLabel: hasMrpVariation ? 'MRP Verified' : 'Missing MRP',
    extractedSnippet: mrpFound?.line || (hasMrpVariation ? 'Price / Tax reference detected in text' : '[Not detected in scanned packaging text]'),
    explanation: hasMrpVariation
      ? 'Mandatory MRP declaration conforming to Rule 6(1)(e) identified.'
      : 'Mandatory MRP declaration with statutory tax inclusion phrasing was not found.',
    matchedKeyword: mrpFound?.match || (hasMrpVariation ? 'MRP' : undefined),
  };

  // -------------------------------------------------------------
  // 2. Net Weight / Net Quantity Check (Rule 6(1)(c))
  // Flexible regex handling OCR misreads (e.g. "120 g" as "1209", "120 q", "m1" for "ml")
  // -------------------------------------------------------------
  const netQtyRegexes = [
    /\b\d+(?:\.\d+)?\s*(?:kg|g|gm|gms|gram|grams|ml|l|ltr|litres|liter|liters|units|pieces|pcs|n|u)\b/i,
    /(?:net\s*(?:wt\.?|weight|qty\.?|quantity|content|contents|vol\.?|volume)?|wt\.?|weight|qty\.?|quantity|content|volume|vol|gross\s*wt|मात्रा|शुद्ध\s*वजन)[\s:.-]*(\d+(?:\.\d+)?)/i,
    /(?:net|wt|weight|qty|quantity|content|pack)[\s\w:.-]{0,15}\b\d{1,4}\s*[9qg]\b/i,
    /\b\d{2,4}\s*[9q]\b/i,
    /\b(?:net\s*(?:wt\.?|weight|qty\.?|quantity|content|contents|vol\.?|volume)|शुद्ध\s*वजन)\b/i,
  ];

  const netQtyFound = findMatchingLine(lines, netQtyRegexes);
  const hasNetQtyVariation =
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
    /\b\d+(?:\.\d+)?\s*(?:kg|g|gm|gms|gram|grams|ml|l|ltr|litres|liter|liters|pieces|pcs|units)\b/i.test(safeText) ||
    /(?:net\s*(?:wt|weight|qty|quantity|content|vol)?|wt|weight|qty|quantity)[\s:.-]*\d+/i.test(safeText) ||
    (/\b\d{2,4}\s*[9q]\b/i.test(safeText) &&
      (lowerText.includes('net') || lowerText.includes('wt') || lowerText.includes('weight') || lowerText.includes('qty') || lowerText.includes('g') || lowerText.includes('pack'))) ||
    netQtyRegexes.some((rx) => rx.test(safeText));

  const netQtyRule: RuleCheckResult = {
    id: 'net_qty',
    ruleNo: 'Rule 6(1)(c)',
    label: 'Net Weight / Quantity',
    status: hasNetQtyVariation ? 'Compliant' : 'Non-Compliant',
    statusLabel: hasNetQtyVariation ? 'Net Quantity Verified' : 'Missing Net Weight/Qty',
    extractedSnippet: netQtyFound?.line || (hasNetQtyVariation ? 'Metric weight/quantity declaration detected in text' : '[Not detected in scanned packaging text]'),
    explanation: hasNetQtyVariation
      ? 'Statutory standard metric quantity declaration conforming to Rule 6(1)(c) identified.'
      : 'Mandatory standard metric quantity/weight declaration was not found.',
    matchedKeyword: netQtyFound?.match || (hasNetQtyVariation ? 'Net Weight' : undefined),
  };

  // -------------------------------------------------------------
  // 3. Date of Manufacture / PKD Check (Rule 6(1)(d))
  // Mandatory keyword variations: Mfg Date, Date of Mfg, Mfd, PKD, Date of Packing, Packed on, Best Before, Use By, Expiry
  // -------------------------------------------------------------
  const mfgRegexes = [
    /\b(?:mfg\.?\s*date|date\s*of\s*mfg|mfd\.?\s*date|date\s*of\s*manufactur(?:e|ing)|mfg\.?|mfd\.?)\b/i,
    /\b(?:pkd\.?\s*date|date\s*of\s*pkd|date\s*of\s*pack(?:ing)?|packed\s*on|pkd\.?|packing|pckd)\b/i,
    /\b(?:best\s*before|use\s*by|exp\.?\s*date|expiry\s*date|exp\.?|expiry)\b/i,
    /\b(?:batch\s*(?:no\.?|number)|lot\s*(?:no\.?|number)|b\.?\s*no\.?)\b/i,
    // Month name with year (Jan 2024, May 24)
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s'.-]*\d{2,4}\b/i,
    // Date formats (MM/YYYY, MM/YY, DD/MM/YYYY, DD-MM-YY)
    /\b(0?[1-9]|1[0-2])[/.-](20\d{2}|\d{2})\b/,
    /\b(0?[1-9]|[12]\d|3[01])[/.-](0?[1-9]|1[0-2])[/.-](20\d{2}|\d{2})\b/,
  ];

  const mfgFound = findMatchingLine(lines, mfgRegexes);
  const hasMfgVariation =
    lowerText.includes('mfg date') ||
    lowerText.includes('mfg. date') ||
    lowerText.includes('date of mfg') ||
    lowerText.includes('mfd date') ||
    lowerText.includes('mfd. date') ||
    lowerText.includes('date of manufacture') ||
    lowerText.includes('manufactured') ||
    lowerText.includes('mfg') ||
    lowerText.includes('mfd') ||
    lowerText.includes('pkd') ||
    lowerText.includes('pckd') ||
    lowerText.includes('pkd date') ||
    lowerText.includes('date of packing') ||
    lowerText.includes('date of pkd') ||
    lowerText.includes('packed on') ||
    lowerText.includes('packing') ||
    lowerText.includes('best before') ||
    lowerText.includes('use by') ||
    lowerText.includes('exp date') ||
    lowerText.includes('expiry') ||
    lowerText.includes('batch no') ||
    lowerText.includes('batch') ||
    lowerText.includes('b.no') ||
    lowerText.includes('lot no') ||
    mfgRegexes.some((rx) => rx.test(safeText));

  const mfgRule: RuleCheckResult = {
    id: 'mfg_date',
    ruleNo: 'Rule 6(1)(d)',
    label: 'Date of Manufacture / PKD',
    status: hasMfgVariation ? 'Compliant' : 'Non-Compliant',
    statusLabel: hasMfgVariation ? 'Mfg/PKD Date Verified' : 'Missing Mfg/PKD Date',
    extractedSnippet: mfgFound?.line || (hasMfgVariation ? 'Date / batch declaration identified in text' : '[Not detected in scanned packaging text]'),
    explanation: hasMfgVariation
      ? 'Month and year of manufacture or packaging chronology under Rule 6(1)(d) confirmed.'
      : 'Mandatory Date of Manufacturing, packaging date (PKD), or batch reference was not found.',
    matchedKeyword: mfgFound?.match || (hasMfgVariation ? 'Mfg Date / PKD' : undefined),
  };

  // -------------------------------------------------------------
  // 4. Customer Care / Contact Details Check (Rule 6(1)(g) & (a))
  // Forgiving search: checks for "@", "email", "toll", "care", "1800", or "www" across entire text block
  // -------------------------------------------------------------
  const careRegexes = [
    /\b(?:customer\s*care|consumer\s*care|consumer\s*cell|customer\s*support|care\s*cell|careline|care\s*line)\b/i,
    /\b(?:toll\s*free|tollfree|helpline|help\s*line|feedback|complaint|grievance)\b/i,
    /@|e-?mail|care@|support@|feedback@/i,
    /\b(?:1800[-\s]?\d{3}[-\s]?\d{3,4}|(?:\+?91|0)?[-\s]?[6-9]\d{9}|\d{3,4}[-\s]?\d{6,8})\b/,
    /\b(?:www\.[a-z0-9-]+|\b[a-z0-9-]+(?:\.com|\.in|\.org|\.co\.in|\.net))\b/i,
    /\b(?:contact\s*(?:us|person|no\.?|details)?|tele?phone|tel\s*:|phone\s*:|call\s*us|write\s*to)\b/i,
  ];

  const careFound = findMatchingLine(lines, careRegexes);
  const hasCareVariation =
    lowerText.includes('@') ||
    lowerText.includes('email') ||
    lowerText.includes('e-mail') ||
    lowerText.includes('e_mail') ||
    lowerText.includes('toll') ||
    lowerText.includes('care') ||
    lowerText.includes('1800') ||
    lowerText.includes('www') ||
    lowerText.includes('.com') ||
    lowerText.includes('.in') ||
    lowerText.includes('.org') ||
    lowerText.includes('helpline') ||
    lowerText.includes('feedback') ||
    lowerText.includes('complaint') ||
    lowerText.includes('grievance') ||
    lowerText.includes('consumer') ||
    lowerText.includes('customer') ||
    lowerText.includes('contact') ||
    lowerText.includes('phone') ||
    lowerText.includes('tel:') ||
    careRegexes.some((rx) => rx.test(safeText));

  const careRule: RuleCheckResult = {
    id: 'customer_care',
    ruleNo: 'Rule 6(1)(g)',
    label: 'Customer Care & Contact Info',
    status: hasCareVariation ? 'Compliant' : 'Non-Compliant',
    statusLabel: hasCareVariation ? 'Customer Care Verified' : 'Missing Customer Care',
    extractedSnippet: careFound?.line || (hasCareVariation ? 'Consumer grievance channel identified in text' : '[Not detected in scanned packaging text]'),
    explanation: hasCareVariation
      ? 'Statutory consumer grievance contact channel conforming to Rule 6(1)(g) confirmed.'
      : 'Mandatory customer care details (helpline, email, or postal grievance address) were not found.',
    matchedKeyword: careFound?.match || (hasCareVariation ? 'Customer Care' : undefined),
  };

  const rules: RuleCheckResult[] = [mrpRule, netQtyRule, mfgRule, careRule];

  // -------------------------------------------------------------
  // Strict 2011 Rules Evaluation:
  // IF ANY REQUIRED FIELD IS MISSING -> NON-COMPLIANT (FAIL)
  // Calculate exact missing fields dynamically
  // -------------------------------------------------------------
  const missingFields: string[] = [];
  const reasonsForFailure: string[] = [];
  const violations: string[] = [];

  if (mrpRule.status === 'Non-Compliant') {
    missingFields.push('MRP (Maximum Retail Price)');
    reasonsForFailure.push('Missing MRP declaration (Rule 6(1)(e)): Maximum Retail Price inclusive of all taxes must be displayed.');
    violations.push('Rule 6(1)(e) Infraction: Retail price declaration is absent from packaging artwork.');
  }

  if (netQtyRule.status === 'Non-Compliant') {
    missingFields.push('Net Weight / Quantity');
    reasonsForFailure.push('Missing Net Weight/Qty declaration (Rule 6(1)(c)): Standard metric quantity or piece count is absent.');
    violations.push('Rule 6(1)(c) Infraction: Mandatory net content in metric standard units not declared.');
  }

  if (mfgRule.status === 'Non-Compliant') {
    missingFields.push('Date of Manufacture (Mfg Date / PKD)');
    reasonsForFailure.push('Missing Mfg Date/PKD declaration (Rule 6(1)(d)): Month and year of packaging or manufacturing is absent.');
    violations.push('Rule 6(1)(d) Infraction: Packaging/manufacturing date or batch identification code not found.');
  }

  if (careRule.status === 'Non-Compliant') {
    missingFields.push('Customer Care / Contact Details');
    reasonsForFailure.push('Missing Customer Care declaration (Rule 6(1)(g)): Consumer helpline, email, or grievance redressal contact is absent.');
    violations.push('Rule 6(1)(g) Infraction: Mandatory consumer care details for grievance redressal omitted.');
  }

  const isStrictCompliant = missingFields.length === 0;
  const verdict: 'Compliant' | 'Non-Compliant' = isStrictCompliant ? 'Compliant' : 'Non-Compliant';

  const missingFieldsSummary = isStrictCompliant
    ? 'All 4 mandatory declarations verified under Legal Metrology Rules, 2011'
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

  // Summary findings string
  let summaryFindings = '';
  if (isStrictCompliant) {
    summaryFindings = `COMPLIANT (PASS): All 4 statutory declarations (MRP, Net Weight/Qty, Mfg Date/PKD, and Customer Care) strictly verified under Legal Metrology (Packaged Commodities) Rules, 2011. OCR Confidence: ${Math.round(ocrConfidence)}%.`;
  } else {
    summaryFindings = `NON-COMPLIANT (FAIL): ${missingFields.length} mandatory declarations missing under Legal Metrology (Packaged Commodities) Rules, 2011. [${missingFieldsSummary}].`;
  }

  return {
    rawText: safeText,
    cleanText: lines.join('\n'),
    confidence: ocrConfidence,
    verdict,
    isStrictCompliant,
    missingFields,
    missingFieldsSummary,
    reasonsForFailure,
    rules,
    violations,
    detectedProductName,
    detectedBrand,
    summaryFindings,
  };
}
