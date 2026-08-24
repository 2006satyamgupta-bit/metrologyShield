import { jsPDF } from "jspdf";
import { AnalysisRecord, ComplianceResult, ExtractedProductDeclarations } from "@/types";
import { CATEGORY_METADATA_MAP } from "@/lib/constants/categoryMatrix";

export class PdfAuditGenerator {
  /**
   * Generates a multi-page Legal Metrology Compliance Audit Certificate and downloads to device
   */
  static generateAndDownloadPdf(analysis: AnalysisRecord): void {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let y = 14;

    const result = analysis.complianceResult;
    const fields = analysis.extractedFields;
    const category = fields?.productCategory || "GENERAL_COMMODITY";
    const categoryLabel = CATEGORY_METADATA_MAP[category]?.label || category;

    // Helper: Add new page if y exceeds limit
    const checkPageBreak = (neededHeight: number = 20) => {
      if (y + neededHeight > pageHeight - 15) {
        doc.addPage();
        y = 15;
        drawPageHeader();
      }
    };

    // Helper: Draw running page header on subsequent pages
    const drawPageHeader = () => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("METROLOGYSHIELD — STATUTORY COMPLIANCE AUDIT CERTIFICATE", margin, 10);
      doc.setFont("helvetica", "normal");
      doc.text(`ID: ${analysis.id.slice(0, 16)}`, pageWidth - margin, 10, { align: "right" });
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, 12, pageWidth - margin, 12);
    };

    // -------------------------------------------------------------
    // 1. TOP HEADER BANNER
    // -------------------------------------------------------------
    // Banner Background
    doc.setFillColor(15, 23, 42); // slate-900
    doc.roundedRect(margin, y, contentWidth, 32, 2, 2, "F");

    // Title & Subtitle
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("METROLOGYSHIELD", margin + 6, y + 9);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(245, 158, 11); // amber-400
    doc.text("OFFICIAL LEGAL METROLOGY COMPLIANCE AUDIT CERTIFICATE", margin + 6, y + 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("Legal Metrology (Packaged Commodities) Rules, 2011 & Legal Metrology Act, 2009", margin + 6, y + 21);
    doc.text(`Category: ${categoryLabel}`, margin + 6, y + 26);

    // Right Side: Audit ID & Timestamp
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`Audit ID: ${analysis.id.slice(0, 16)}`, pageWidth - margin - 6, y + 9, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    const dateStr = result?.assessedAt
      ? new Date(result.assessedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
      : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    doc.text(`Issued: ${dateStr}`, pageWidth - margin - 6, y + 15, { align: "right" });
    doc.text(`Status: Official Audit Record`, pageWidth - margin - 6, y + 21, { align: "right" });

    y += 38;

    // -------------------------------------------------------------
    // 2. AUDIT SUMMARY BOX & HERO SCORE
    // -------------------------------------------------------------
    const status = result?.overallStatus || "COMPLIANT";
    const score = result?.complianceScore ?? 100;

    let statusBg = [16, 185, 129]; // emerald
    let statusText = "COMPLIANT";
    if (status === "NON_COMPLIANT") {
      statusBg = [225, 29, 72]; // rose
      statusText = "NON-COMPLIANT";
    } else if (status === "PARTIALLY_COMPLIANT" || status === "REQUIRES_REVIEW") {
      statusBg = [217, 119, 6]; // amber
      statusText = "REQUIRES REVIEW";
    }

    // Outer summary card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 26, 2, 2, "FD");

    // Status Badge Block
    doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
    doc.roundedRect(margin + 4, y + 4, 48, 18, 1.5, 1.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(statusText, margin + 28, y + 12, { align: "center" });
    doc.setFontSize(7);
    doc.text(`Score: ${score}%`, margin + 28, y + 18, { align: "center" });

    // Product & SKU Details
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(analysis.productName || "Unnamed Package Label", margin + 58, y + 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Commodity: ${categoryLabel}`, margin + 58, y + 15);
    doc.text(
      `Rules Evaluated: ${result?.totalRulesEvaluated ?? 10}  |  Passed: ${result?.passedRulesCount ?? 0}  |  Violations: ${result?.failedRulesCount ?? 0}  |  Warnings: ${result?.warningRulesCount ?? 0}`,
      margin + 58,
      y + 21
    );

    y += 32;

    // -------------------------------------------------------------
    // 3. STATUTORY SUMMARY STATEMENT
    // -------------------------------------------------------------
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text("EXECUTIVE COMPLIANCE SUMMARY:", margin + 4, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    const summaryLines = doc.splitTextToSize(
      result?.summaryNote || "The package label has been audited against mandatory statutory requirements under the Legal Metrology (Packaged Commodities) Rules, 2011.",
      contentWidth - 8
    );
    doc.text(summaryLines, margin + 4, y + 9);

    y += 18;

    // -------------------------------------------------------------
    // 4. STATUTORY DECLARATIONS TABLE
    // -------------------------------------------------------------
    checkPageBreak(30);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text("1. STATUTORY PRODUCT DECLARATIONS (RULE 6 COMPLIANCE)", margin, y);
    y += 4;

    // Table Header
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(margin, y, contentWidth, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text("MANDATORY STATUTORY FIELD", margin + 3, y + 4.2);
    doc.text("EXTRACTED / DECLARED VALUE", margin + 65, y + 4.2);
    doc.text("STATUS", margin + 140, y + 4.2);
    doc.text("CONF.", margin + 168, y + 4.2);
    y += 6;

    const declList: Array<{ label: string; field: string; ref: string }> = [
      { label: "Product / Generic Name", field: "productName", ref: "Rule 6(1)(b)" },
      { label: "Brand Name", field: "brandName", ref: "Brand Identity" },
      { label: "Article / SKU Code", field: "articleCode", ref: "Commodity Standards" },
      { label: "Style Identification", field: "style", ref: "Commodity Standards" },
      { label: "Product Colour", field: "colour", ref: "Visual Identity" },
      { label: "Foot Length / Size Dimension", field: "dimensionOrSize", ref: "BIS Footwear / Rule 6" },
      { label: "Net Quantity & Metric Unit", field: "netQuantity", ref: "Rule 6(1)(c) & Rule 11" },
      { label: "Maximum Retail Price (MRP)", field: "mrp", ref: "Rule 6(1)(e) & Rule 2(m)" },
      { label: "MRP Tax Inclusivity", field: "mrpInclusiveTaxes", ref: "Rule 6(1)(e)" },
      { label: "Unit Sale Price (USP)", field: "unitSalePrice", ref: "Rule 6(1)(g)" },
      { label: "Date of Manufacture / Packing", field: "manufacturingDate", ref: "Rule 6(1)(d)" },
      { label: "Expiry / Best Before Date", field: "expiryDate", ref: "Rule 10 & Standards" },
      { label: "Country of Origin", field: "countryOfOrigin", ref: "Rule 6(1)(a) & Rule 27" },
      { label: "Manufacturer / Packed By", field: "manufacturerName", ref: "Rule 6(1)(a)" },
      { label: "Marketing / Registered Postal Address", field: "manufacturerAddress", ref: "Rule 6(1)(a)" },
      { label: "Consumer Care Helpline", field: "consumerCarePhone", ref: "Rule 6(1)(f)" },
      { label: "Consumer Grievance Email", field: "consumerCareEmail", ref: "Rule 6(1)(f)" },
      { label: "FSSAI / Mfg License Number", field: "fssaiNumber", ref: "Statutory Licensing" },
    ];

    let rowIdx = 0;
    for (const item of declList) {
      const fieldData = fields ? (fields as any)[item.field] : null;
      if (!fieldData && (item.field === "brandName" || item.field === "articleCode" || item.field === "style" || item.field === "colour" || item.field === "dimensionOrSize")) {
        continue;
      }

      checkPageBreak(8);

      doc.setFillColor(rowIdx % 2 === 0 ? 255 : 248, rowIdx % 2 === 0 ? 255 : 250, rowIdx % 2 === 0 ? 255 : 252);
      doc.rect(margin, y, contentWidth, 6, "F");
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y + 6, margin + contentWidth, y + 6);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(30, 41, 59);
      doc.text(item.label, margin + 3, y + 4.2);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(51, 65, 85);
      const valStr = fieldData?.value ? String(fieldData.value).slice(0, 52) : fieldData?.status === "NOT_APPLICABLE" ? "[ Exempt / Not Applicable ]" : "[ Missing / Not Declared ]";
      doc.text(valStr, margin + 65, y + 4.2);

      // Status text
      const fStatus = fieldData?.status || "MISSING";
      if (fStatus === "DETECTED") {
        doc.setTextColor(16, 185, 129);
        doc.setFont("helvetica", "bold");
        doc.text("DETECTED", margin + 140, y + 4.2);
      } else if (fStatus === "UNCERTAIN") {
        doc.setTextColor(217, 119, 6);
        doc.setFont("helvetica", "bold");
        doc.text("REVIEW", margin + 140, y + 4.2);
      } else if (fStatus === "NOT_APPLICABLE") {
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        doc.text("EXEMPT", margin + 140, y + 4.2);
      } else {
        doc.setTextColor(225, 29, 72);
        doc.setFont("helvetica", "bold");
        doc.text("MISSING", margin + 140, y + 4.2);
      }

      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`${fieldData?.confidence ?? 0}%`, margin + 168, y + 4.2);

      y += 6;
      rowIdx++;
    }

    y += 6;

    // -------------------------------------------------------------
    // 5. STATUTORY RULES AUDIT BREAKDOWN
    // -------------------------------------------------------------
    checkPageBreak(30);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text("2. CODIFIED STATUTORY RULES EVALUATION (LEGAL METROLOGY ACT, 2009)", margin, y);
    y += 4;

    const violations = result?.violations || [];
    for (const v of violations) {
      checkPageBreak(18);

      let cardBg = [248, 250, 252];
      let borderCol = [226, 232, 240];
      let badgeCol = [16, 185, 129];
      let badgeText = "PASS";

      if (v.status === "VIOLATION") {
        cardBg = [255, 241, 242]; // rose-50
        borderCol = [254, 205, 211];
        badgeCol = [225, 29, 72];
        badgeText = `VIOLATION (${v.severity})`;
      } else if (v.status === "WARNING") {
        cardBg = [255, 251, 235]; // amber-50
        borderCol = [253, 230, 138];
        badgeCol = [217, 119, 6];
        badgeText = `WARNING (${v.severity})`;
      } else if (v.status === "NOT_APPLICABLE") {
        cardBg = [248, 250, 252];
        borderCol = [226, 232, 240];
        badgeCol = [100, 116, 139];
        badgeText = "NOT APPLICABLE";
      }

      doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
      doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
      doc.roundedRect(margin, y, contentWidth, 14, 1, 1, "FD");

      // Rule Badge & Code
      doc.setFillColor(badgeCol[0], badgeCol[1], badgeCol[2]);
      doc.roundedRect(margin + 2, y + 2, 26, 4.5, 0.8, 0.8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(255, 255, 255);
      doc.text(badgeText, margin + 15, y + 5.2, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${v.ruleCode} — ${v.ruleName}`, margin + 31, y + 5.2);

      // Legal Reference
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Ref: ${v.statutoryReference || v.ruleCode}`, pageWidth - margin - 3, y + 5.2, { align: "right" });

      // Description / Analysis text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(51, 65, 85);
      const textToWrap = v.legalExplanation || v.expectedRequirement || "";
      const wrappedAnalysis = doc.splitTextToSize(textToWrap, contentWidth - 8);
      doc.text(wrappedAnalysis[0] || "", margin + 3, y + 10);

      y += 16;
    }

    // -------------------------------------------------------------
    // 6. STATUTORY DISCLAIMER & SIGN-OFF
    // -------------------------------------------------------------
    checkPageBreak(25);

    doc.setFillColor(15, 23, 42);
    doc.rect(margin, y, contentWidth, 0.5, "F");
    y += 4;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text("STATUTORY NOTICE UNDER SECTION 36, LEGAL METROLOGY ACT, 2009:", margin, y);
    y += 3.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.8);
    doc.setTextColor(100, 116, 139);
    const disclaimer =
      "Whoever manufactures, packs, imports, sells, distributes, or delivers any pre-packaged commodity that does not conform to the declarations on the package prescribed under the Legal Metrology (Packaged Commodities) Rules, 2011 shall be punishable with a fine which may extend to twenty-five thousand rupees, and for the second offence with fine which may extend to fifty thousand rupees, and for the subsequent offence with fine which may extend to one lakh rupees or with imprisonment for a term which may extend to one year or with both.";
    const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth);
    doc.text(disclaimerLines, margin, y);
    y += disclaimerLines.length * 2.8 + 4;

    // Footer signature line
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(30, 41, 59);
    doc.text("Automated Regulatory Verification Engine • MetrologyShield Intelligence System", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toISOString()} • Page ${doc.getNumberOfPages()}`, pageWidth - margin, y, {
      align: "right",
    });

    // -------------------------------------------------------------
    // 7. SAVE & DOWNLOAD TO DEVICE
    // -------------------------------------------------------------
    const sanitizeSku = (analysis.productName || "Commodity")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 30);
    const filename = `MetrologyShield_Audit_${sanitizeSku}_${analysis.id.slice(0, 8)}.pdf`;
    doc.save(filename);
  }
}
