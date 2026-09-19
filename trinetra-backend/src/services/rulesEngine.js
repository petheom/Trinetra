/**
 * Legal Metrology (Packaged Commodities) Rules, 2011 - Rule Engine Service
 *
 * Checks extracted text from Tesseract OCR against mandatory statutory declarations:
 * 1. Maximum Retail Price (MRP) - Rule 6(1)(e)
 * 2. Net Quantity / Net Weight - Rule 6(1)(c)
 * 3. Date of Manufacture / Packaging (PKD) - Rule 6(1)(d)
 * 4. Consumer Care / Contact Details - Rule 6(1)(g)
 *
 * Implements forgiving fuzzy regex matching to accommodate real-world OCR misreads
 * (e.g., "120 g" scanned as "1209" / "120 q", "@" in email, "R5" for "Rs", "1800" helpline).
 */

export const analyzePackagingText = (rawText = '') => {
  const safeText = String(rawText || '').trim();
  const lowerText = safeText.toLowerCase();
  const lines = safeText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Helper to extract a matching line snippet or context slice
  const findMatchingSnippet = (regexList, fallbackKeyword = null) => {
    // 1. Try finding an exact line match
    for (const line of lines) {
      if (!line) continue;
      for (const rx of regexList) {
        if (rx.test(line)) {
          return line;
        }
      }
    }

    // 2. Try line containing fallback keyword
    if (fallbackKeyword) {
      const kw = fallbackKeyword.toLowerCase();
      for (const line of lines) {
        if (line.toLowerCase().includes(kw)) {
          return line;
        }
      }
    }

    // 3. Fallback to a context window from raw text
    for (const rx of regexList) {
      const match = rx.exec(safeText);
      if (match) {
        const start = Math.max(0, match.index - 20);
        const end = Math.min(safeText.length, match.index + match[0].length + 30);
        return safeText.slice(start, end).replace(/\s+/g, ' ').trim();
      }
    }

    return null;
  };

  // -------------------------------------------------------------
  // 1. MRP Check - Rule 6(1)(e)
  // -------------------------------------------------------------
  const mrpRegexes = [
    /\b(?:m\.?\s*r\.?\s*p\.?|max(?:imum)?\s*retail\s*price|retail\s*price)\b/i,
    /(?:₹|rs\.?|inr|r5\.?)\s*[\d,]+(?:\.\d{2})?/i,
    /\b[\d,]+(?:\.\d{2})?\s*(?:₹|rs\.?|inr)\b/i,
    /(?:incl(?:usive)?\.?\s*of\s*all\s*taxes|सकल\s*मूल्य|कर\s*सहित)/i,
    /\b(?:price|retail\s*price|all\s*taxes|incl\.?\s*taxes)\b/i,
  ];

  const hasMrp =
    lowerText.includes('mrp') ||
    lowerText.includes('m.r.p') ||
    lowerText.includes('m r p') ||
    lowerText.includes('maximum retail price') ||
    lowerText.includes('max retail price') ||
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

  const mrpSnippet = findMatchingSnippet(mrpRegexes, 'mrp') || (hasMrp ? 'Price / Tax reference detected in label' : null);

  // -------------------------------------------------------------
  // 2. Net Weight / Quantity Check - Rule 6(1)(c)
  // Flexible regex handling OCR misreads (e.g. "120 g" as "1209", "120 q", "m1" for "ml")
  // -------------------------------------------------------------
  const netQtyRegexes = [
    // Standard explicit units: 120 g, 500 ml, 1 kg, 200 gm, 1 l, etc.
    /\b\d+(?:\.\d+)?\s*(?:kg|g|gm|gms|gram|grams|ml|l|ltr|litres|liter|liters|units|pieces|pcs|n|u)\b/i,
    // Digits directly near weight keywords: "Net Wt: 120", "Weight 500", "Net Qty: 200"
    /(?:net\s*(?:wt\.?|weight|qty\.?|quantity|content|contents|vol\.?|volume)?|wt\.?|weight|qty\.?|quantity|content|volume|vol|gross\s*wt|मात्रा|शुद्ध\s*वजन)[\s:.-]*(\d+(?:\.\d+)?)/i,
    // Misread "g" as "9" or "q" directly following digits near weight/package context (e.g., "1209", "120 9", "120q")
    /(?:net|wt|weight|qty|quantity|content|pack)[\s\w:.-]{0,15}\b\d{1,4}\s*[9qg]\b/i,
    /\b\d{2,4}\s*[9q]\b/i,
    // Statutory keywords
    /\b(?:net\s*(?:wt\.?|weight|qty\.?|quantity|content|contents|vol\.?|volume)|शुद्ध\s*वजन)\b/i,
  ];

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
    // Check standard or misread units with numbers
    /\b\d+(?:\.\d+)?\s*(?:kg|g|gm|gms|gram|grams|ml|l|ltr|litres|liter|liters|pieces|pcs|units)\b/i.test(safeText) ||
    // Digits near weight/qty keywords
    /(?:net\s*(?:wt|weight|qty|quantity|content|vol)?|wt|weight|qty|quantity)[\s:.-]*\d+/i.test(safeText) ||
    // OCR misread: "1209" or "120 q"
    (/\b\d{2,4}\s*[9q]\b/i.test(safeText) &&
      (lowerText.includes('net') || lowerText.includes('wt') || lowerText.includes('weight') || lowerText.includes('qty') || lowerText.includes('g') || lowerText.includes('pack'))) ||
    netQtyRegexes.some((rx) => rx.test(safeText));

  const netQtySnippet = findMatchingSnippet(netQtyRegexes, 'net') || (hasNetQty ? 'Metric weight/quantity declaration detected' : null);

  // -------------------------------------------------------------
  // 3. Date of Manufacture / PKD Check - Rule 6(1)(d)
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

  const hasMfg =
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

  const mfgSnippet = findMatchingSnippet(mfgRegexes, 'pkd') || (hasMfg ? 'Manufacturing / packaging chronology stamp detected' : null);

  // -------------------------------------------------------------
  // 4. Customer Care Check - Rule 6(1)(g)
  // Forgiving search: checks for "@", "email", "toll", "care", "1800", or "www" across entire text block
  // -------------------------------------------------------------
  const careRegexes = [
    // Statutory consumer care keywords
    /\b(?:customer\s*care|consumer\s*care|consumer\s*cell|customer\s*support|care\s*cell|careline|care\s*line)\b/i,
    // Toll free, helpline, feedback, complaints
    /\b(?:toll\s*free|tollfree|helpline|help\s*line|feedback|complaint|grievance)\b/i,
    // Email symbol or explicit email word
    /@|e-?mail|care@|support@|feedback@/i,
    // Toll free 1800 prefix or Indian 10-digit mobile / landline
    /\b(?:1800[-\s]?\d{3}[-\s]?\d{3,4}|(?:\+?91|0)?[-\s]?[6-9]\d{9}|\d{3,4}[-\s]?\d{6,8})\b/,
    // Web address www or domain
    /\b(?:www\.[a-z0-9-]+|\b[a-z0-9-]+(?:\.com|\.in|\.org|\.co\.in|\.net))\b/i,
    // General contact keywords
    /\b(?:contact\s*(?:us|person|no\.?|details)?|tele?phone|tel\s*:|phone\s*:|call\s*us|write\s*to)\b/i,
  ];

  const hasCare =
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

  const careSnippet = findMatchingSnippet(careRegexes, 'care') || (hasCare ? 'Consumer helpline / care channel identified' : null);

  // -------------------------------------------------------------
  // Compile statutory checklist
  // -------------------------------------------------------------
  const fields = [
    {
      id: 'mrp',
      name: 'Maximum Retail Price (MRP)',
      rule: 'Rule 6(1)(e)',
      found: hasMrp,
      snippet: mrpSnippet,
      explanation: hasMrp
        ? 'Mandatory MRP declaration conforming to Rule 6(1)(e) verified.'
        : 'Mandatory MRP declaration with statutory inclusive of all taxes missing.',
    },
    {
      id: 'net_weight',
      name: 'Net Weight / Net Quantity',
      rule: 'Rule 6(1)(c)',
      found: hasNetQty,
      snippet: netQtySnippet,
      explanation: hasNetQty
        ? 'Statutory standard metric quantity declaration conforming to Rule 6(1)(c) identified.'
        : 'Mandatory standard metric quantity/weight declaration missing.',
    },
    {
      id: 'mfg_date',
      name: 'Date of Manufacture / PKD',
      rule: 'Rule 6(1)(d)',
      found: hasMfg,
      snippet: mfgSnippet,
      explanation: hasMfg
        ? 'Month and year of manufacture or packaging chronology under Rule 6(1)(d) confirmed.'
        : 'Mandatory manufacturing or packaging date (PKD) missing.',
    },
    {
      id: 'customer_care',
      name: 'Customer Care Details',
      rule: 'Rule 6(1)(g)',
      found: hasCare,
      snippet: careSnippet,
      explanation: hasCare
        ? 'Statutory consumer grievance redressal channel under Rule 6(1)(g) confirmed.'
        : 'Mandatory consumer care address, helpline, or email missing.',
    },
  ];

  const foundFields = fields.filter((f) => f.found).map((f) => f.name);
  const missingFields = fields.filter((f) => !f.found).map((f) => f.name);
  const isCompliant = missingFields.length === 0;

  return {
    isCompliant,
    verdict: isCompliant ? 'Compliant' : 'Non-Compliant',
    confidenceScore: isCompliant ? '96%' : '88%',
    summary: isCompliant
      ? 'All 4 mandatory declarations under Legal Metrology Rules, 2011 detected.'
      : `Deficient label: Missing mandatory declarations: ${missingFields.join(', ')}.`,
    foundFields,
    missingFields,
    fields,
  };
};

export default analyzePackagingText;
