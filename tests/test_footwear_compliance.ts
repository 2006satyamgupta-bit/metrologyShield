import path from "path";
import { OcrService } from "../services/ocr/ocrService";
import { RegexPatternExtractor } from "../services/ai/regexExtractor";
import { ComplianceEngine } from "../services/compliance/complianceEngine";

async function testFootwearCategoryPipeline() {
  console.log("================================================================================");
  console.log("METROLOGYSHIELD — CATEGORY-AWARE FOOTWEAR COMPLIANCE PIPELINE TEST");
  console.log("================================================================================\n");

  const imagePath = path.join(
    process.cwd(),
    "public",
    "uploads",
    "8677058a-44dc-4991-9444-1bdeb2f216e5-fe884349-bfb9-478d-a142-a7f1346e2d3c.jpeg"
  );

  console.log(`Analyzing Footwear Package Artwork: ${imagePath}`);

  // 1. OCR
  const ocrRes = await OcrService.extractText(imagePath, "test-footwear-analysis");
  console.log("\n--- [ 1. RAW OCR TEXT ] ---");
  console.log(ocrRes.rawText);

  // 2. Category-Aware Extraction
  const declarations = RegexPatternExtractor.extractDeclarationsFromText(ocrRes.rawText, ocrRes.lines);

  console.log("\n--- [ 2. CATEGORY CLASSIFICATION ] ---");
  console.log(`Classified Category: ${declarations.productCategory}`);

  console.log("\n--- [ 3. EXTRACTED STATUTORY DECLARATIONS & 4-STATE STATUS ] ---");
  const checkFields = [
    "productName",
    "brandName",
    "articleCode",
    "style",
    "colour",
    "dimensionOrSize",
    "netQuantity",
    "mrp",
    "mrpInclusiveTaxes",
    "manufacturingDate",
    "countryOfOrigin",
    "manufacturerName",
    "manufacturerAddress",
    "consumerCarePhone",
    "consumerCareEmail",
    "fssaiNumber",
    "ingredients",
    "expiryDate",
  ];

  for (const f of checkFields) {
    const item = (declarations as any)[f];
    if (item) {
      console.log(`  • [${item.label.toUpperCase()}]: ${item.value ? `"${item.value}"` : "[ None ]"} -> Status: ${item.status} (${item.confidence}%)`);
    }
  }

  // 3. Compliance Evaluation
  const compliance = ComplianceEngine.evaluate("test-footwear-analysis", declarations, ocrRes.rawText);

  console.log("\n--- [ 4. COMPLIANCE ENGINE AUDIT RESULTS ] ---");
  console.log(`Overall Status: ${compliance.overallStatus}`);
  console.log(`Compliance Score: ${compliance.complianceScore}%`);
  console.log(`Total Rules Evaluated: ${compliance.totalRulesEvaluated}`);
  console.log(`Passed Rules: ${compliance.passedRulesCount}`);
  console.log(`Failed Rules: ${compliance.failedRulesCount}`);

  console.log("\nStatutory Rules Breakdown:");
  for (const v of compliance.violations) {
    console.log(`  - ${v.ruleCode} (${v.ruleName}): [${v.status}] - Severity: ${v.severity}`);
  }

  console.log("\n================================================================================");
  console.log("ASSERTIONS:");
  console.log("================================================================================");
  const isFootwear = declarations.productCategory === "FOOTWEAR";
  console.log(`1. Category is FOOTWEAR: ${isFootwear ? "✅ PASS" : "❌ FAIL"}`);

  const isFssaiExempt = declarations.fssaiNumber?.status === "NOT_APPLICABLE";
  console.log(`2. FSSAI License is NOT_APPLICABLE for Footwear: ${isFssaiExempt ? "✅ PASS" : "❌ FAIL"}`);

  const isExpExempt = declarations.expiryDate?.status === "NOT_APPLICABLE";
  console.log(`3. Expiry Date is NOT_APPLICABLE for Footwear: ${isExpExempt ? "✅ PASS" : "❌ FAIL"}`);

  const isNetQtyPair = declarations.netQuantity?.value === "1 Pair";
  console.log(`4. Net Quantity is '1 Pair': ${isNetQtyPair ? "✅ PASS" : "❌ FAIL"}`);

  const isMrpCorrect = declarations.mrp?.value === "₹ 4,799.00";
  console.log(`5. MRP is '₹ 4,799.00': ${isMrpCorrect ? "✅ PASS" : "❌ FAIL"}`);

  const isOriginIndia = declarations.countryOfOrigin?.value?.toUpperCase() === "INDIA";
  console.log(`6. Country of Origin is INDIA: ${isOriginIndia ? "✅ PASS" : "❌ FAIL"}`);

  const isCompliant = compliance.overallStatus === "COMPLIANT" && compliance.complianceScore >= 90;
  console.log(`7. Footwear Compliance Score >= 90% and COMPLIANT: ${isCompliant ? "✅ PASS" : "❌ FAIL"}`);
  console.log("================================================================================\n");
}

testFootwearCategoryPipeline();
