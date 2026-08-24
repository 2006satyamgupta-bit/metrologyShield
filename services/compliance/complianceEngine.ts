import { v4 as uuidv4 } from "uuid";
import { STATUTORY_COMPLIANCE_RULES } from "@/lib/constants/legalRules";
import {
  ComplianceResult,
  ComplianceStatus,
  ExtractedProductDeclarations,
  RuleEvaluationStatus,
  ViolationRecord,
  ViolationSeverity,
} from "@/types";

export class ComplianceEngine {
  /**
   * Authoritative deterministic evaluation of extracted declarations against LMPC Rules, 2011.
   */
  static evaluate(
    analysisId: string,
    declarations: ExtractedProductDeclarations,
    rawOcrText: string = ""
  ): ComplianceResult {
    const violations: ViolationRecord[] = [];

    // Helper to push a rule result
    const recordEvaluation = (
      ruleCode: string,
      status: RuleEvaluationStatus,
      severity: ViolationSeverity,
      detectedValue: string | null,
      expectedRequirement: string,
      legalExplanation: string,
      recommendedCorrection: string
    ) => {
      const def = STATUTORY_COMPLIANCE_RULES.find((r) => r.ruleCode === ruleCode);
      violations.push({
        id: uuidv4(),
        ruleId: def?.ruleId || ruleCode,
        ruleCode,
        ruleName: def?.name || ruleCode,
        category: def?.category || "GENERAL",
        status,
        severity,
        detectedValue,
        expectedRequirement,
        legalExplanation,
        recommendedCorrection,
        statutoryReference: def?.legalReference || "Legal Metrology (Packaged Commodities) Rules, 2011",
      });
    };

    // -------------------------------------------------------------
    // 1. RULE 6(1)(a): Manufacturer / Packer / Importer Name & Postal Address
    // -------------------------------------------------------------
    const mfrName = declarations.manufacturerName?.value;
    const mfrAddress = declarations.manufacturerAddress?.value;

    if (!mfrName && !mfrAddress) {
      recordEvaluation(
        "LMPC-R6-1A-MFR",
        "VIOLATION",
        "CRITICAL",
        null,
        "Name and complete physical address of the manufacturer/packer/importer including city, state, and 6-digit postal PIN code.",
        "Rule 6(1)(a) requires that every package shall bear the name and complete address of the manufacturer or packer. Failure to declare this is a severe violation under Section 36 of the Legal Metrology Act, 2009.",
        "Add explicit declaration: 'Manufactured and Packed by: [Full Registered Business Name], [Street/Plot Address], [City], [State] - [PIN Code]'."
      );
    } else if (mfrName && !mfrAddress) {
      recordEvaluation(
        "LMPC-R6-1A-MFR",
        "VIOLATION",
        "HIGH",
        `Name: "${mfrName}", Address: Missing`,
        "Complete physical postal address with PIN code.",
        "Declaring only the manufacturer name without the complete postal address violates Rule 6(1)(a). The consumer must be able to correspond with the manufacturer.",
        "Include full postal address with state and 6-digit postal PIN code alongside the manufacturer name."
      );
    } else if (mfrAddress && !mfrAddress.match(/\b[1-9][0-9]{5}\b/)) {
      recordEvaluation(
        "LMPC-R6-1A-MFR",
        "WARNING",
        "MEDIUM",
        mfrAddress,
        "Complete address including 6-digit postal PIN code.",
        "While the address is declared, a standard 6-digit Indian PIN code was not clearly detected. Enforcement authorities may treat ambiguous addresses as non-compliant.",
        "Ensure the complete 6-digit postal PIN code is clearly legible (e.g. 'New Delhi - 110001')."
      );
    } else {
      recordEvaluation(
        "LMPC-R6-1A-MFR",
        "PASS",
        "INFO",
        `${mfrName || "Manufacturer"} (${mfrAddress})`,
        "Name and complete postal address.",
        "Complies with Rule 6(1)(a).",
        "Maintain current compliant format."
      );
    }

    // -------------------------------------------------------------
    // 2. RULE 6(1)(a) & 27: Country of Origin
    // -------------------------------------------------------------
    const coo = declarations.countryOfOrigin?.value;
    if (!coo) {
      recordEvaluation(
        "LMPC-R6-1A-COO",
        "VIOLATION",
        "HIGH",
        null,
        "Explicit Country of Origin declaration (e.g., 'Country of Origin: India' or 'Made in India').",
        "Rule 6(1)(a) and Rule 27 mandate clear declaration of Country of Origin on all packaged goods and imported commodities.",
        "Add prominent declaration: 'Country of Origin: India' (or applicable country of manufacture)."
      );
    } else {
      recordEvaluation(
        "LMPC-R6-1A-COO",
        "PASS",
        "INFO",
        coo,
        "Country of Origin declaration.",
        "Complies with statutory origin declaration requirements.",
        "Keep clearly visible."
      );
    }

    // -------------------------------------------------------------
    // 3. RULE 6(1)(b): Generic or Common Name of Commodity
    // -------------------------------------------------------------
    const genericName = declarations.genericName?.value || declarations.productName?.value;
    if (!genericName) {
      recordEvaluation(
        "LMPC-R6-1B-GEN",
        "VIOLATION",
        "HIGH",
        null,
        "Common or generic name of the commodity on the principal display panel.",
        "Rule 6(1)(b) requires the common or generic name to prevent deception regarding the nature of the packaged contents.",
        "Print the generic name of the commodity conspicuously (e.g., 'Potato Wafers', 'Instant Coffee Powder', 'Liquid Detergent')."
      );
    } else {
      recordEvaluation(
        "LMPC-R6-1B-GEN",
        "PASS",
        "INFO",
        genericName,
        "Generic or common commodity name.",
        "Complies with Rule 6(1)(b).",
        "Ensure generic name font size meets principal display panel requirements under Rule 7."
      );
    }

    // -------------------------------------------------------------
    // 4. RULE 6(1)(c) & RULES 11, 12, 13: Net Quantity & Metric Units
    // -------------------------------------------------------------
    const netQty = declarations.netQuantity?.value;
    const netQtyUnit = declarations.netQuantityUnit?.value?.toLowerCase() || "";

    const illegalUnitsRegex = /\b(gms|gm|kilos|k\.g\.|cc|pkts|pkt)\b/i;
    const standardUnitsRegex = /^(kg|g|l|ml|m|cm|mm|sq\s*m|n|u|pair|pairs|unit|units|piece|pieces|pcs|set|sets|count)$/i;

    if (!netQty) {
      recordEvaluation(
        "LMPC-R6-1C-QTY",
        "VIOLATION",
        "CRITICAL",
        null,
        "Net quantity declared in standard SI metric units (e.g., 'Net Quantity: 500 g' or '1 kg' or '750 ml' or '1 Pair').",
        "Rule 6(1)(c) and Rule 11 mandate declaration of correct net quantity. Omission of net quantity is a primary statutory offence.",
        "Add explicit declaration: 'Net Quantity: [Value] [Standard Unit (g/kg/ml/l/N/Pair)]'."
      );
    } else if (illegalUnitsRegex.test(netQty) || (netQtyUnit && ["gms", "gm", "cc", "kilos", "pkts"].includes(netQtyUnit))) {
      recordEvaluation(
        "LMPC-R6-1C-QTY",
        "VIOLATION",
        "CRITICAL",
        netQty,
        "Standard SI metric unit symbols (use 'g' not 'gms'/'gm'; use 'kg' not 'kilos'; use 'ml' not 'cc').",
        "Rule 13 strictly prohibits non-standard abbreviations and symbols. Writing 'gms', 'gm', 'kilos', or 'cc' violates the Fifth Schedule of the Legal Metrology (Packaged Commodities) Rules.",
        "Replace illegal unit abbreviation with standard SI symbol: use 'g' instead of 'gms'/'gm', or 'ml' instead of 'cc'."
      );
    } else {
      recordEvaluation(
        "LMPC-R6-1C-QTY",
        "PASS",
        "INFO",
        netQty,
        "Standard SI metric unit quantity declaration.",
        "Complies with Rule 6(1)(c) and Rule 13.",
        "Verify font height complies with Table under Rule 7 based on net weight."
      );
    }

    // -------------------------------------------------------------
    // 5. RULE 6(1)(d): Month & Year of Manufacture / Packing / Import
    // -------------------------------------------------------------
    const mfgDate = declarations.manufacturingDate?.value || declarations.packagingDate?.value;
    if (!mfgDate) {
      recordEvaluation(
        "LMPC-R6-1D-DATE",
        "VIOLATION",
        "HIGH",
        null,
        "Month and year of manufacture or pre-packaging (e.g. '04/2024' or 'April 2024').",
        "Rule 6(1)(d) mandates declaration of the month and year in which the commodity was manufactured or pre-packed.",
        "Print 'Mfg Date: MM/YYYY' or 'Date of Packaging: MM/YYYY' prominently on the label."
      );
    } else {
      recordEvaluation(
        "LMPC-R6-1D-DATE",
        "PASS",
        "INFO",
        mfgDate,
        "Month and Year of manufacture or packing.",
        "Complies with Rule 6(1)(d).",
        "Keep format consistent across batch printing."
      );
    }

    // -------------------------------------------------------------
    // 6. RULE 6(1)(e) & RULE 2(m): MRP & Mandatory Inclusive of All Taxes
    // -------------------------------------------------------------
    const mrp = declarations.mrp?.value;
    const mrpTax = declarations.mrpInclusiveTaxes?.value;

    if (!mrp) {
      recordEvaluation(
        "LMPC-R6-1E-MRP",
        "VIOLATION",
        "CRITICAL",
        null,
        "Maximum Retail Price in format: 'MRP Rs. XX.XX (incl. of all taxes)' or '₹ XX.XX (inclusive of all taxes)'.",
        "Rule 6(1)(e) and Rule 2(m) require unambiguous declaration of the retail sale price inclusive of all taxes.",
        "Add: 'MRP ₹ XX.XX (incl. of all taxes)' or 'Maximum Retail Price Rs. XX.XX (inclusive of all taxes)'."
      );
    } else if (!mrpTax && !rawOcrText.toLowerCase().includes("incl") && !rawOcrText.toLowerCase().includes("inclusive")) {
      recordEvaluation(
        "LMPC-R6-1E-MRP",
        "VIOLATION",
        "CRITICAL",
        mrp,
        "Explicit statement '(incl. of all taxes)' or '(inclusive of all taxes)'.",
        "Rule 6(1)(e) mandates that the MRP declaration MUST include the words 'inclusive of all taxes' or 'incl. of all taxes'. Printing only the amount without this phrase is a major statutory violation.",
        `Update price declaration to: "${mrp} (incl. of all taxes)".`
      );
    } else {
      recordEvaluation(
        "LMPC-R6-1E-MRP",
        "PASS",
        "INFO",
        `${mrp} (incl. of all taxes)`,
        "MRP with statutory tax inclusivity statement.",
        "Complies with Rule 6(1)(e) and Rule 2(m).",
        "Ensure no stickers are used to alter printed MRP."
      );
    }

    // -------------------------------------------------------------
    // 7. RULE 6(1)(g): Unit Sale Price (USP)
    // -------------------------------------------------------------
    const category = declarations.productCategory || "GENERAL_COMMODITY";
    const usp = declarations.unitSalePrice?.value;

    if (category === "FOOTWEAR" || category === "APPAREL") {
      recordEvaluation(
        "LMPC-R6-1G-USP",
        "NOT_APPLICABLE",
        "INFO",
        "1 Pair / Standard Unit",
        "Unit Sale Price declaration.",
        "Single-unit footwear and readymade apparel items are exempt from Unit Sale Price declarations under Rule 6(1)(g).",
        "No correction required."
      );
    } else if (!usp) {
      recordEvaluation(
        "LMPC-R6-1G-USP",
        "WARNING",
        "MEDIUM",
        null,
        "Unit Sale Price (e.g. '₹ 0.50 / g' or '₹ 20.00 / 100ml' or '₹ 10.00 / N').",
        "Under the 2021/2022 Legal Metrology (Packaged Commodities) Amendment, packages containing more than 1 kg / 1 L or multi-piece items must declare the Unit Sale Price.",
        "Calculate and add: 'Unit Sale Price: ₹ X.XX per g / ml / unit' rounded to 2 decimal places."
      );
    } else {
      recordEvaluation(
        "LMPC-R6-1G-USP",
        "PASS",
        "INFO",
        usp,
        "Unit Sale Price declaration.",
        "Complies with Rule 6(1)(g) amendment.",
        "Verify unit price math matches total MRP divided by net contents."
      );
    }

    // -------------------------------------------------------------
    // 8. RULE 6(1)(f): Consumer Care Contact Details
    // -------------------------------------------------------------
    const carePhone = declarations.consumerCarePhone?.value;
    const careEmail = declarations.consumerCareEmail?.value;
    const careAddress = declarations.consumerCareAddress?.value;

    if (!carePhone && !careEmail) {
      recordEvaluation(
        "LMPC-R6-1F-CARE",
        "VIOLATION",
        "HIGH",
        null,
        "Consumer care details: designated person/cell, postal address, telephone/toll-free number, and email ID.",
        "Rule 6(1)(f) requires consumer care contact details to enable direct redressal of consumer grievances.",
        "Add: 'For Consumer Feedback/Complaints: Contact Customer Care Executive at [Address], Tel: [Phone/Helpline], Email: [Email]'."
      );
    } else if (!careEmail || !carePhone) {
      recordEvaluation(
        "LMPC-R6-1F-CARE",
        "WARNING",
        "MEDIUM",
        `Phone: ${carePhone || "Missing"}, Email: ${careEmail || "Missing"}`,
        "Both telephone number and email address required under Rule 6(1)(f).",
        "Rule 6(1)(f) specifies that the consumer care mechanism must provide both telephonic and electronic mail channels.",
        `Include both phone helpline and email ID (missing: ${!careEmail ? "email" : "phone"}).`
      );
    } else {
      recordEvaluation(
        "LMPC-R6-1F-CARE",
        "PASS",
        "INFO",
        `Tel: ${carePhone}, Email: ${careEmail}`,
        "Complete Consumer Care telephone and email channel.",
        "Complies with Rule 6(1)(f).",
        "Ensure helpline is active during business hours."
      );
    }

    // -------------------------------------------------------------
    // 9. RULE 10: Best Before / Expiry Date
    // -------------------------------------------------------------
    const expiry = declarations.expiryDate?.value || declarations.bestBefore?.value;
    if (category === "FOOTWEAR" || category === "APPAREL" || category === "ELECTRONICS") {
      recordEvaluation(
        "LMPC-R10-EXP",
        "NOT_APPLICABLE",
        "INFO",
        "Exempt",
        "Best Before / Use By declaration for perishable or consumable commodities.",
        "Footwear, apparel, and durable non-perishable goods are exempt from Rule 10 expiry declarations.",
        "No correction required."
      );
    } else if (!expiry) {
      recordEvaluation(
        "LMPC-R10-EXP",
        "WARNING",
        "LOW",
        null,
        "Best Before / Use By declaration for perishable or consumable commodities.",
        "While non-perishable hardware/durables may be exempt, consumable or cosmetic products require clear expiry/best before dates.",
        "If this product is consumable or perishable, declare: 'Best Before [X] months from packaging' or 'Expiry: MM/YYYY'."
      );
    } else {
      recordEvaluation(
        "LMPC-R10-EXP",
        "PASS",
        "INFO",
        expiry,
        "Best Before / Expiry declaration.",
        "Complies with product longevity guidelines.",
        "Ensure batch expiry matches manufacturing records."
      );
    }

    // -------------------------------------------------------------
    // 10. RULE 18: Dual MRP & Anti-Tampering Check
    // -------------------------------------------------------------
    const dualMrpMatch = rawOcrText.match(/(?:mrp|price)[\s\S]{1,40}(?:mrp|price)/gi);
    if (dualMrpMatch && dualMrpMatch.length > 2) {
      recordEvaluation(
        "LMPC-R18-DUAL",
        "WARNING",
        "HIGH",
        "Multiple price indicators detected in OCR text",
        "Single unambiguous MRP declaration without conflicting price points.",
        "Rule 18(1) strictly prohibits declaring dual or multiple Maximum Retail Prices on the same packaged commodity.",
        "Ensure only one single authoritative MRP is printed on the package artwork."
      );
    } else {
      recordEvaluation(
        "LMPC-R18-DUAL",
        "PASS",
        "INFO",
        "Single MRP detected",
        "Prohibition of Dual MRP.",
        "Complies with Rule 18.",
        "Maintain single pricing."
      );
    }

    // -------------------------------------------------------------
    // Calculate Final Aggregate Compliance Score & Overall Status
    // -------------------------------------------------------------
    let score = 100;
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let warningCount = 0;
    let passedCount = 0;

    violations.forEach((v) => {
      if (v.status === "PASS") {
        passedCount++;
      } else if (v.status === "VIOLATION") {
        if (v.severity === "CRITICAL") {
          criticalCount++;
          score -= 25;
        } else if (v.severity === "HIGH") {
          highCount++;
          score -= 15;
        } else if (v.severity === "MEDIUM") {
          mediumCount++;
          score -= 8;
        } else {
          score -= 4;
        }
      } else if (v.status === "WARNING") {
        warningCount++;
        score -= 4;
      }
    });

    score = Math.max(0, Math.min(100, Math.round(score)));

    let overallStatus: ComplianceStatus = "COMPLIANT";
    if (criticalCount > 0 || score < 50) {
      overallStatus = "NON_COMPLIANT";
    } else if (highCount > 0 || mediumCount > 0 || score < 80) {
      overallStatus = "PARTIALLY_COMPLIANT";
    } else if (warningCount > 2) {
      overallStatus = "REQUIRES_REVIEW";
    } else {
      overallStatus = "COMPLIANT";
    }

    const summaryNote =
      overallStatus === "COMPLIANT"
        ? "The package label satisfies all mandatory statutory declarations under the Legal Metrology (Packaged Commodities) Rules, 2011."
        : overallStatus === "PARTIALLY_COMPLIANT"
        ? `The label contains minor or partial non-compliances (${highCount + mediumCount} items). Immediate correction is recommended prior to retail distribution.`
        : overallStatus === "REQUIRES_REVIEW"
        ? "The label contains declarations requiring manual audit or verification against principal display panel font size guidelines."
        : `CRITICAL STATUTORY VIOLATIONS DETECTED (${criticalCount} critical, ${highCount} high). Distribution of this packaging poses direct prosecution risk under Section 36 of the Legal Metrology Act, 2009.`;

    return {
      id: uuidv4(),
      analysisId,
      overallStatus,
      complianceScore: score,
      totalRulesEvaluated: violations.length,
      passedRulesCount: passedCount,
      failedRulesCount: criticalCount + highCount + mediumCount,
      warningRulesCount: warningCount,
      assessedAt: new Date().toISOString(),
      violations,
      summaryNote,
    };
  }
}
