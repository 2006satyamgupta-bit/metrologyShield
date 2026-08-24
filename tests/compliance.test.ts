import { ComplianceEngine } from "../services/compliance/complianceEngine";
import { RegexPatternExtractor } from "../services/ai/regexExtractor";
import { StorageService } from "../services/storage/storageService";
import { STATUTORY_COMPLIANCE_RULES } from "../lib/constants/legalRules";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log("\n=======================================================");
console.log("METROLOGYSHIELD — STATUTORY COMPLIANCE & RULES TEST SUITE");
console.log("=======================================================\n");

// --- TEST 1: Fully Compliant Label Evaluation ---
console.log("--- Test Suite 1: Fully Compliant Label ---");
const compliantOcrText = `
NUTRAVITA ROASTED CASHEWS
Generic Name: Roasted & Salted Cashew Kernels
Net Quantity: 250 g
MRP Rs. 350.00 (incl. of all taxes)
Unit Sale Price: Rs. 1.40 / g
Mfg Date: 05/2024
Best Before: 6 Months from packaging
Country of Origin: India
Manufactured & Packed By: Nutravita Foods Private Limited, Plot No. 45-B, Sector 18, Industrial Estate, Gurgaon, Haryana - 122015
For Consumer Complaints: Contact Grievance Officer, Toll Free: 1800-200-8899, Email: customercare@nutravitafoods.in
`;

const extractedCompliant = RegexPatternExtractor.extractDeclarationsFromText(compliantOcrText);
const compliantResult = ComplianceEngine.evaluate("test-comp-1", extractedCompliant, compliantOcrText);

assert(compliantResult.overallStatus === "COMPLIANT", `Expected COMPLIANT, got ${compliantResult.overallStatus}`);
assert(compliantResult.complianceScore >= 90, `Expected score >= 90, got ${compliantResult.complianceScore}`);
assert(compliantResult.failedRulesCount === 0, `Expected 0 failed rules, got ${compliantResult.failedRulesCount}`);

// --- TEST 2: Rule 13 Illegal Unit Abbreviation & Missing Tax Statement ---
console.log("\n--- Test Suite 2: Non-Compliant Label (Rule 13 'gms' & Missing MRP Tax Statement) ---");
const nonCompliantOcrText = `
SPARKLE ULTRA CLEAN DETERGENT
Net Wt: 500 gms
Price: Rs. 99.00
Mfg: May 2024
Packed By: Sparkle Chemical Corp, Industrial Belt
Helpline: 9876543210
`;

const extractedNonCompliant = RegexPatternExtractor.extractDeclarationsFromText(nonCompliantOcrText);
const nonCompliantResult = ComplianceEngine.evaluate("test-non-comp-2", extractedNonCompliant, nonCompliantOcrText);

assert(nonCompliantResult.overallStatus === "NON_COMPLIANT", `Expected NON_COMPLIANT, got ${nonCompliantResult.overallStatus}`);
assert(nonCompliantResult.complianceScore < 60, `Expected score < 60, got ${nonCompliantResult.complianceScore}`);

const netQtyViolation = nonCompliantResult.violations.find((v) => v.ruleCode === "LMPC-R6-1C-QTY");
assert(netQtyViolation?.status === "VIOLATION", "Expected Net Quantity Rule 13 violation for 'gms'");
assert(netQtyViolation?.severity === "CRITICAL", "Expected Net Quantity Rule 13 violation to be CRITICAL");

const mrpViolation = nonCompliantResult.violations.find((v) => v.ruleCode === "LMPC-R6-1E-MRP");
assert(mrpViolation?.status === "VIOLATION", "Expected MRP tax inclusivity violation");

const cooViolation = nonCompliantResult.violations.find((v) => v.ruleCode === "LMPC-R6-1A-COO");
assert(cooViolation?.status === "VIOLATION", "Expected Country of Origin violation");

// --- TEST 3: Storage File Validation ---
console.log("\n--- Test Suite 3: Storage & File Upload Validation ---");
const validFile = StorageService.validateFile({
  size: 5 * 1024 * 1024,
  type: "image/png",
  name: "test.png",
});
assert(validFile.valid === true, "Expected 5MB PNG file to be valid");

const oversizeFile = StorageService.validateFile({
  size: 20 * 1024 * 1024,
  type: "image/jpeg",
  name: "big.jpg",
});
assert(oversizeFile.valid === false, "Expected 20MB file to fail validation");

const invalidFormat = StorageService.validateFile({
  size: 1024,
  type: "application/pdf",
  name: "doc.pdf",
});
assert(invalidFormat.valid === false, "Expected PDF file to fail validation");

// --- TEST 4: Statutory Rules Catalog Integrity ---
console.log("\n--- Test Suite 4: Statutory Rules Catalog Integrity ---");
assert(STATUTORY_COMPLIANCE_RULES.length >= 10, "Expected at least 10 codified statutory rules");
const mfrRule = STATUTORY_COMPLIANCE_RULES.find((r) => r.ruleCode === "LMPC-R6-1A-MFR");
assert(Boolean(mfrRule), "Expected LMPC-R6-1A-MFR rule to exist in catalog");
assert(Boolean(mfrRule?.legalReference), "Expected legal reference to be defined");

console.log("\n=======================================================");
console.log("ALL STATUTORY COMPLIANCE UNIT TESTS PASSED SUCCESSFULLY! 🎉");
console.log("=======================================================\n");
