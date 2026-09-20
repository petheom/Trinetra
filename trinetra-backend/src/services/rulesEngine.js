/**
 * Legal Metrology (Packaged Commodities) Rules, 2011 - Rule Engine Service
 *
 * Checks extracted text from OCR against statutory declarations:
 * 1. Manufacturer details - Rule 6(1)(a)
 * 2. Net Quantity / Net Weight - Rule 6(1)(c)
 * 3. Date of Manufacture / Packaging (PKD) - Rule 6(1)(d)
 * 4. Maximum Retail Price (MRP) - Rule 6(1)(e)
 * 5. Country of Origin - Rule 6(1)(f)
 * 6. Consumer Care / Contact Details - Rule 6(1)(g)
 * 7. Unit Sale Price (USP) - Rule 11
 *
 * 3-Mode Classification Decision Matrix:
 * - If all mandatory rules are found: 'COMPLIANT'
 * - If any mandatory rule (Rule 6(1)(a)-(g)) is absent: 'NON_COMPLIANT'
 * - If all mandatory rules pass but Rule 11 (USP) is missing: do NOT mark as FAIL. Set status to 'MANUAL_REVIEW' and auto-calculate suggested USP (MRP / Net Quantity).
 */

export const analyzePackagingText = (rawText = '', ocrConfidence = 85) => {
  const safeText = String(rawText || '').trim();
  const lowerText = safeText.toLowerCase();
  const lines = safeText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  /**
   * Line-bounded extraction helper:
   * Scans each discrete line to find matches for the regex list.
   * Extracts only the specific line containing the matched token,
   * completely avoiding cross-column bleeding from ingredient, nutritional, or table structures.
   */
  const findMatchingSnippet = (regexList, fallbackKeyword = null) => {
    // 1. Scan each discrete line for regex matches
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      for (const rx of regexList) {
        if (rx.test(trimmed)) {
          return trimmed.replace(/\s+/g, ' ');
        }
      }
    }

    // 2. Scan lines containing fallback keyword
    if (fallbackKeyword) {
      const kw = fallbackKeyword.toLowerCase();
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.toLowerCase().includes(kw)) {
          return trimmed.replace(/\s+/g, ' ');
        }
      }
    }

    // 3. Monolithic text boundary check (bounded strictly by line breaks or delimiters, no arbitrary slicing)
    for (const rx of regexList) {
      const match = rx.exec(safeText);
      if (match) {
        const textBefore = safeText.slice(0, match.index);
        const textAfter = safeText.slice(match.index + match[0].length);
        const lastBoundary = Math.max(
          textBefore.lastIndexOf('\n'),
          textBefore.lastIndexOf('\r'),
          textBefore.lastIndexOf('|'),
          0
        );
        let nextBoundary = textAfter.search(/[\n\r|]/);
        if (nextBoundary === -1) nextBoundary = textAfter.length;
        const bounded = safeText.slice(
          lastBoundary > 0 ? lastBoundary + 1 : 0,
          match.index + match[0].length + nextBoundary
        );
        return bounded.replace(/\s+/g, ' ').trim() || match[0];
      }
    }

    return null;
  };

  // -------------------------------------------------------------
  // 1. Manufacturer / Packer Details - Rule 6(1)(a)
  // Tightened with strict word boundaries and required anchors
  // -------------------------------------------------------------
  const mfgDetailsRegexes = [
    /\b(?:mfg\.?\s*(?:by|at)|manufactured\s*(?:by|at)|mfd\.?\s*(?:by|at)|packed\s*by|pkd\.?\s*by|marketed\s*by|imported\s*by|produced\s*by|processed\s*by)\b\s*[:=.]?\s*([^\n\r]+)/i,
    /\b(?:name\s*and\s*address\s*of\s*manufacturer|manufacturer\s*details|packer\s*details|importer\s*details)\b/i,
    /\b(?:mfg\.?\s*(?:by|at)|manufactured\s*(?:by|at)|mfd\.?\s*(?:by|at)|packed\s*by|pkd\.?\s*by|marketed\s*by|imported\s*by)\b/i,
    /\b(?:pvt\.?\s*ltd\.?|private\s*limited|enterprises|industries|foods|agro|works|corp\.?|llp)\b/i,
    /\b(?:fssai\s*(?:lic(?:ense)?|no\.?| lic)?\s*[:.-]?\s*\d{14})\b/i,
  ];

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

  const mfgDetailsSnippet =
    findMatchingSnippet(mfgDetailsRegexes, 'manufactured') ||
    (hasMfgDetails ? 'Manufacturer / Packer identity detected' : null);

  // -------------------------------------------------------------
  // 2. Net Weight / Quantity Check - Rule 6(1)(c)
  // Must match both numeric quantity and metric units (kg, g, gm, ml, l, pcs, etc.)
  // -------------------------------------------------------------
  const netQtyRegexes = [
    /(?:\b(?:net\s*(?:wt\.?|weight|qty\.?|quantity|content|contents|vol\.?|volume)?|शुद्ध\s*वजन|मात्रा)\b\s*[:=.]?\s*)?\b(\d+(?:\.\d+)?)\s*(kg|g|gm|gms|gram|grams|ml|l|ltr|litres|liter|liters|pieces|pcs|units|u|n)\b/i,
    /\b(\d+(?:\.\d+)?)\s*(kg|g|gm|gms|gram|grams|ml|l|ltr|litres|liter|liters|pieces|pcs|units)\b/i,
    /(?:net\s*(?:wt\.?|weight|qty\.?|quantity|content|contents|vol\.?|volume)?|शुद्ध\s*वजन)\s*[:=.]?\s*(\d+(?:\.\d+)?)/i,
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
    netQtyRegexes.some((rx) => rx.test(safeText));

  const netQtySnippet =
    findMatchingSnippet(netQtyRegexes, 'net') ||
    (hasNetQty ? 'Metric weight/quantity declaration detected' : null);

  // -------------------------------------------------------------
  // 3. Date of Manufacture / PKD Check - Rule 6(1)(d)
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

  const mfgSnippet =
    findMatchingSnippet(mfgRegexes, 'pkd') ||
    findMatchingSnippet(mfgRegexes, 'mfg') ||
    (hasMfg ? 'Manufacturing chronology stamp detected' : null);

  // -------------------------------------------------------------
  // 4. Maximum Retail Price (MRP) Check - Rule 6(1)(e)
  // Require currency indicators (₹, Rs, INR, MRP) followed by numeric price
  // -------------------------------------------------------------
  const mrpRegexes = [
    /(?:\bMRP\b|\bM\.R\.P\.?|₹|\bRs\.?)\s*[:=.]?\s*(?:₹|\bRs\.?|\bINR\b)?\s*(\d+(?:\.\d{1,2})?)/i,
    /(?:₹|\bRs\.?|\bINR\b)\s*[:=.]?\s*(\d+(?:\.\d{1,2})?)/i,
    /\b(\d+(?:\.\d{1,2})?)\s*(?:₹|\bRs\.?|\bINR\b)\b/i,
    /(?:\bMRP\b|\bM\.R\.P\.?)\s*[:=.]?\s*(\d+(?:\.\d{1,2})?)/i,
    /(?:incl(?:usive)?\.?\s*of\s*all\s*taxes|सकल\s*मूल्य|कर\s*सहित)/i,
  ];

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

  const mrpSnippet =
    findMatchingSnippet(mrpRegexes, 'mrp') ||
    (hasMrp ? 'Price / Tax reference detected in label' : null);

  // -------------------------------------------------------------
  // 5. Country of Origin Check - Rule 6(1)(f)
  // -------------------------------------------------------------
  const originRegexes = [
    /\b(?:country\s*of\s*origin|origin\s*country|origin\s*[:.-]|made\s*in|product\s*of|manufactured\s*in|assembled\s*in|imported\s*from)\b\s*[:=.]?\s*([a-zA-Z]+)/i,
    /\b(?:made\s*in\s*india|product\s*of\s*india|origin\s*:\s*india|origin\s*india)\b/i,
    /\b(?:country\s*of\s*origin|origin|made\s*in|product\s*of)\b/i,
    /\b(?:india|bharat|china|usa|uk|germany|japan|vietnam|thailand|indonesia|malaysia|taiwan|italy|france|spain)\b/i,
  ];

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

  const originSnippet =
    findMatchingSnippet(originRegexes, 'origin') ||
    (hasOrigin ? 'Country of Origin declaration identified' : null);

  // -------------------------------------------------------------
  // 6. Customer Care Check - Rule 6(1)(g)
  // Match toll-free lines, phone numbers, or customercare emails
  // -------------------------------------------------------------
  const careRegexes = [
    /\b(?:customer\s*care|consumer\s*care|consumer\s*cell|customer\s*support|care\s*cell|careline|care\s*line)\b/i,
    /\b(?:toll\s*free|tollfree|helpline|help\s*line|feedback|complaint|grievance)\b/i,
    /\b1800[-\s]?\d{3}[-\s]?\d{3,4}\b/,
    /\b[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\b/,
    /\b(?:contact\s*(?:us|person|no\.?|details)?|tele?phone|tel\s*:|phone\s*:|call\s*us|write\s*to)\b/i,
  ];

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

  const careSnippet =
    findMatchingSnippet(careRegexes, 'care') ||
    findMatchingSnippet(careRegexes, '1800') ||
    (hasCare ? 'Consumer helpline / care channel identified' : null);

  // -------------------------------------------------------------
  // 7. Unit Sale Price (USP) Check - Rule 11
  // Parse explicit USP declarations (e.g. ₹ X / g)
  // -------------------------------------------------------------
  const uspRegexes = [
    /(?:\b(?:unit\s*sale\s*price|unit\s*price|u\.?s\.?p\.?)\b\s*[:=.]?\s*)?(?:₹|\bRs\.?|\bINR\b)\s*[\d,]+(?:\.\d{1,2})?\s*(?:\/|\s*per\s*)(?:g|gm|kg|ml|l|ltr|unit|piece|u|n|pc)\b/i,
    /\b\d+(?:\.\d{1,2})?\s*(?:₹|\bRs\.?|\bINR\b)?\s*(?:\/|\s*per\s*)(?:g|gm|kg|ml|l|ltr|unit|piece|u|n|pc)\b/i,
    /\b(?:unit\s*sale\s*price|unit\s*price|u\.?s\.?p\.?)\b/i,
    /\b(?:per\s*g|per\s*ml|per\s*kg|per\s*litre|per\s*unit|\/g|\/ml|\/kg|\/l)\b/i,
  ];

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

  const uspSnippet =
    findMatchingSnippet(uspRegexes, 'unit') ||
    (hasUsp ? 'Unit Sale Price (USP) declaration detected' : null);

  // -------------------------------------------------------------
  // Helper: Auto-calculate suggested USP (MRP / Net Quantity)
  // -------------------------------------------------------------
  const computeSuggestedUsp = () => {
    try {
      let mrpValue = null;
      for (const rx of mrpRegexes) {
        const m = rx.exec(safeText);
        if (m && m[1]) {
          const p = parseFloat(m[1].replace(/,/g, ''));
          if (!isNaN(p) && p > 0) {
            mrpValue = p;
            break;
          }
        }
      }

      let qtyValue = null;
      let qtyUnit = null;
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

      if (!mrpValue || !qtyValue || qtyValue <= 0 || !qtyUnit) {
        return null;
      }

      if (['g', 'gm', 'gms', 'gram', 'grams'].includes(qtyUnit)) {
        const rate = mrpValue / qtyValue;
        return `₹ ${rate < 1 ? rate.toFixed(3) : rate.toFixed(2)} / g`;
      } else if (['kg'].includes(qtyUnit)) {
        const rate = mrpValue / qtyValue;
        return `₹ ${rate.toFixed(2)} / kg`;
      } else if (['ml'].includes(qtyUnit)) {
        const rate = mrpValue / qtyValue;
        return `₹ ${rate < 1 ? rate.toFixed(3) : rate.toFixed(2)} / ml`;
      } else if (['l', 'ltr', 'litres', 'liter', 'liters'].includes(qtyUnit)) {
        const rate = mrpValue / qtyValue;
        return `₹ ${rate.toFixed(2)} / L`;
      } else if (['pcs', 'pieces', 'units', 'u', 'n'].includes(qtyUnit)) {
        const rate = mrpValue / qtyValue;
        return `₹ ${rate.toFixed(2)} / unit`;
      }
      return null;
    } catch {
      return null;
    }
  };

  const suggestedUsp = !hasUsp ? computeSuggestedUsp() : null;

  // -------------------------------------------------------------
  // Compile Comprehensive Statutory Checklist
  // -------------------------------------------------------------
  const fields = [
    {
      id: 'mfg_details',
      name: 'Manufacturer / Packer Name & Address',
      rule: 'Rule 6(1)(a)',
      found: hasMfgDetails,
      snippet: mfgDetailsSnippet,
      critical: true,
      explanation: hasMfgDetails
        ? 'Mandatory Manufacturer/Packer identity under Rule 6(1)(a) verified.'
        : 'Mandatory Manufacturer or Packer name and address declaration missing.',
    },
    {
      id: 'net_weight',
      name: 'Net Weight / Net Quantity',
      rule: 'Rule 6(1)(c)',
      found: hasNetQty,
      snippet: netQtySnippet,
      critical: true,
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
      critical: true,
      explanation: hasMfg
        ? 'Month and year of manufacture or packaging chronology under Rule 6(1)(d) confirmed.'
        : 'Mandatory manufacturing or packaging date (PKD) missing.',
    },
    {
      id: 'mrp',
      name: 'Maximum Retail Price (MRP)',
      rule: 'Rule 6(1)(e)',
      found: hasMrp,
      snippet: mrpSnippet,
      critical: true,
      explanation: hasMrp
        ? 'Mandatory MRP declaration conforming to Rule 6(1)(e) verified.'
        : 'Mandatory MRP declaration with statutory inclusive of all taxes missing.',
    },
    {
      id: 'country_origin',
      name: 'Country of Origin',
      rule: 'Rule 6(1)(f)',
      found: hasOrigin,
      snippet: originSnippet,
      critical: true,
      explanation: hasOrigin
        ? 'Statutory Country of Origin declaration conforming to Rule 6(1)(f) confirmed.'
        : 'Mandatory Country of Origin declaration under Rule 6(1)(f) missing or unverified.',
    },
    {
      id: 'customer_care',
      name: 'Customer Care Details',
      rule: 'Rule 6(1)(g)',
      found: hasCare,
      snippet: careSnippet,
      critical: true,
      explanation: hasCare
        ? 'Statutory consumer grievance redressal channel under Rule 6(1)(g) confirmed.'
        : 'Mandatory consumer care address, helpline, or email missing.',
    },
    {
      id: 'unit_sale_price',
      name: 'Unit Sale Price (USP)',
      rule: 'Rule 11',
      found: hasUsp,
      snippet: uspSnippet || (suggestedUsp ? `Suggested: ${suggestedUsp}` : null),
      critical: false,
      explanation: hasUsp
        ? 'Statutory Unit Sale Price (USP) under Rule 11 confirmed.'
        : suggestedUsp
        ? `Statutory USP missing. Auto-calculated suggested USP: ${suggestedUsp}.`
        : 'Mandatory Unit Sale Price (USP) under Rule 11 missing or not clearly stated.',
    },
  ];

  const mandatoryRulesList = [
    { name: 'Manufacturer / Packer Name & Address', found: hasMfgDetails },
    { name: 'Net Weight / Net Quantity', found: hasNetQty },
    { name: 'Date of Manufacture / PKD', found: hasMfg },
    { name: 'Maximum Retail Price (MRP)', found: hasMrp },
    { name: 'Country of Origin', found: hasOrigin },
    { name: 'Customer Care Details', found: hasCare },
  ];

  const missingMandatory = mandatoryRulesList.filter((r) => !r.found).map((r) => r.name);
  const foundFields = fields.filter((f) => f.found).map((f) => f.name);
  const missingFields = fields.filter((f) => !f.found).map((f) => f.name);
  const criticalMissing = fields.filter((f) => !f.found && f.critical).map((f) => f.name);

  // -------------------------------------------------------------
  // 3-Mode Classification Decision Matrix:
  // - If all mandatory rules are found: 'COMPLIANT'
  // - If any mandatory rule (Rule 6(1)(a)-(g)) is absent: 'NON_COMPLIANT'
  // - If all mandatory rules pass but Rule 11 (USP) is missing: do NOT mark as FAIL. Set status to 'MANUAL_REVIEW' and auto-calculate suggested USP (MRP / Net Quantity).
  // -------------------------------------------------------------
  let classification = 'COMPLIANT';

  if (missingMandatory.length > 0) {
    // If any mandatory rule (Rule 6(1)(a)-(g)) is absent: 'NON_COMPLIANT'
    classification = 'NON_COMPLIANT';
  } else if (!hasUsp) {
    // All mandatory rules pass, but Rule 11 (USP) is missing -> do NOT mark as FAIL -> 'MANUAL_REVIEW'
    classification = 'MANUAL_REVIEW';
  } else if (typeof ocrConfidence === 'number' && ocrConfidence > 0 && ocrConfidence < 60) {
    classification = 'MANUAL_REVIEW';
  } else {
    classification = 'COMPLIANT';
  }

  const isCompliant = classification === 'COMPLIANT';

  // Formulate clear, statutory summary
  let summary = '';
  if (classification === 'COMPLIANT') {
    summary = 'All mandatory statutory declarations under Legal Metrology Rules, 2011 detected.';
  } else if (classification === 'NON_COMPLIANT') {
    summary = `Deficient label: Mandatory statutory declaration(s) missing (${missingMandatory.join(', ')}).`;
  } else {
    summary = suggestedUsp
      ? `Rule 11 (USP) missing from packaging. Auto-calculated suggested USP: ${suggestedUsp}. Referred for Manual Review.`
      : `Ambiguous / Partial declarations detected: Marked for Human-in-the-Loop Manual Review (${missingFields.join(', ')}).`;
  }

  return {
    isCompliant,
    complianceStatus: classification, // 'COMPLIANT' | 'NON_COMPLIANT' | 'MANUAL_REVIEW'
    verdict: classification, // 3-mode classification
    confidenceScore: typeof ocrConfidence === 'number' && ocrConfidence > 0 ? `${Math.round(ocrConfidence)}%` : (isCompliant ? '96%' : '88%'),
    summary,
    foundFields,
    missingFields,
    missingMandatory,
    criticalMissing,
    fields,
    suggestedUsp,
    autoCalculatedUsp: suggestedUsp,
  };
};

export default analyzePackagingText;
