import { AnalysisOrchestrator } from "../services/orchestrator/analysisOrchestrator";
import { DatabaseRepository } from "../lib/database/db";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log("\n=======================================================");
console.log("METROLOGYSHIELD — END-TO-END PIPELINE & DATABASE TEST");
console.log("=======================================================\n");

async function runPipelineTest() {
  const userId = "test-auditor-123";
  const dummyImageBuffer = Buffer.from("dummy-image-data-for-pipeline-test");

  console.log("--- 1. Testing Database Initial Stats ---");
  const initialStats = await DatabaseRepository.getDashboardStats(userId);
  assert(initialStats !== null, "Expected initial dashboard stats object");
  console.log(`Initial total analyses: ${initialStats.totalAnalyses}`);

  console.log("\n--- 2. Testing Direct Analysis Creation & Retrieval ---");
  const testId = "test-analysis-pipeline-" + Date.now();
  await DatabaseRepository.createAnalysis({
    id: testId,
    userId,
    productName: "Organic Green Tea 100g",
    status: "COMPLETED",
  });

  const retrieved = await DatabaseRepository.getAnalysisById(testId);
  assert(retrieved !== null, "Expected created analysis to be retrieved from repository");
  assert(retrieved?.productName === "Organic Green Tea 100g", "Expected product name to match");

  console.log("\n--- 3. Testing User Analysis Query & Search ---");
  const userAnalyses = await DatabaseRepository.getUserAnalyses(userId, {
    search: "Green Tea",
  });
  assert(userAnalyses.length > 0, "Expected search query to find created record");
  assert(userAnalyses[0].id === testId, "Expected retrieved ID to match created ID");

  console.log("\n--- 4. Testing User Re-evaluation with Field Edits ---");
  const editedRecord = await AnalysisOrchestrator.reevaluateWithUserCorrections(
    testId,
    userId,
    {
      productName: { fieldName: "productName", label: "Product", value: "Organic Green Tea 100g", status: "DETECTED", confidence: 1, isUserCorrected: false },
      genericName: { fieldName: "genericName", label: "Generic Name", value: "Green Tea Leaves", status: "DETECTED", confidence: 1, isUserCorrected: false },
      manufacturerName: { fieldName: "manufacturerName", label: "Manufacturer", value: "Himalayan Herbs Ltd", status: "DETECTED", confidence: 1, isUserCorrected: false },
      manufacturerAddress: { fieldName: "manufacturerAddress", label: "Address", value: "Plot 10, Kangra Valley, HP - 176001", status: "DETECTED", confidence: 1, isUserCorrected: true },
      countryOfOrigin: { fieldName: "countryOfOrigin", label: "Origin", value: "India", status: "DETECTED", confidence: 1, isUserCorrected: false },
      netQuantity: { fieldName: "netQuantity", label: "Net Qty", value: "100 g", status: "DETECTED", confidence: 1, isUserCorrected: false },
      netQuantityUnit: { fieldName: "netQuantityUnit", label: "Unit", value: "g", status: "DETECTED", confidence: 1, isUserCorrected: false },
      netQuantityValue: { fieldName: "netQuantityValue", label: "Value", value: "100", status: "DETECTED", confidence: 1, isUserCorrected: false },
      mrp: { fieldName: "mrp", label: "MRP", value: "Rs. 250.00", status: "DETECTED", confidence: 1, isUserCorrected: false },
      mrpInclusiveTaxes: { fieldName: "mrpInclusiveTaxes", label: "MRP Taxes", value: "incl. of all taxes", status: "DETECTED", confidence: 1, isUserCorrected: true },
      unitSalePrice: { fieldName: "unitSalePrice", label: "USP", value: "Rs. 2.50 / g", status: "DETECTED", confidence: 1, isUserCorrected: false },
      manufacturingDate: { fieldName: "manufacturingDate", label: "Mfg Date", value: "06/2024", status: "DETECTED", confidence: 1, isUserCorrected: false },
      packagingDate: { fieldName: "packagingDate", label: "Pkd Date", value: "06/2024", status: "DETECTED", confidence: 1, isUserCorrected: false },
      expiryDate: { fieldName: "expiryDate", label: "Expiry Date", value: "06/2025", status: "DETECTED", confidence: 1, isUserCorrected: false },
      consumerCareName: { fieldName: "consumerCareName", label: "Care Name", value: "Care Cell", status: "DETECTED", confidence: 1, isUserCorrected: false },
      consumerCareAddress: { fieldName: "consumerCareAddress", label: "Care Address", value: "Kangra Valley, HP - 176001", status: "DETECTED", confidence: 1, isUserCorrected: false },
      consumerCarePhone: { fieldName: "consumerCarePhone", label: "Care Phone", value: "1800-111-222", status: "DETECTED", confidence: 1, isUserCorrected: false },
      consumerCareEmail: { fieldName: "consumerCareEmail", label: "Care Email", value: "care@himalayanherbs.in", status: "DETECTED", confidence: 1, isUserCorrected: false },
      otherDeclarations: [],
    }
  );

  assert(editedRecord.complianceStatus === "COMPLIANT", `Expected COMPLIANT after full field edits, got ${editedRecord.complianceStatus}`);
  assert((editedRecord.complianceScore ?? 0) >= 90, `Expected score >= 90, got ${editedRecord.complianceScore}`);

  console.log("\n--- 5. Testing Deletion & Security Scoping ---");
  const deleted = await DatabaseRepository.deleteAnalysis(testId, userId);
  assert(deleted === true, "Expected record deletion to succeed");

  const checkDeleted = await DatabaseRepository.getAnalysisById(testId);
  assert(checkDeleted === null, "Expected deleted analysis to no longer exist");

  console.log("\n=======================================================");
  console.log("ALL PIPELINE & REPOSITORY TESTS PASSED! 🎉");
  console.log("=======================================================\n");
}

runPipelineTest().catch((err) => {
  console.error("Pipeline test failed:", err);
  process.exit(1);
});
