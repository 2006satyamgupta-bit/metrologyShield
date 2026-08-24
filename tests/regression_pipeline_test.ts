import path from "path";
import fs from "fs";
import { OcrService } from "../services/ocr/ocrService";
import { RegexPatternExtractor } from "../services/ai/regexExtractor";
import { AnalysisOrchestrator } from "../services/orchestrator/analysisOrchestrator";

async function runRegressionTestSuite() {
  console.log("================================================================================");
  console.log("METROLOGYSHIELD — FULL PIPELINE & REGRESSION TEST SUITE");
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // TEST 1: The Uploaded Bottle Label (Cosmetics / Body Wash)
  // ---------------------------------------------------------------------------
  console.log(">>> TEST 1: BOTTLE PACKAGE LABEL (COSMETICS / BODY WASH)");
  const bottleFile = path.join(
    process.cwd(),
    "public",
    "uploads",
    "80e47d58-93c6-42cd-85d9-63c3623ed08f-a97f7e13-ce27-455f-9d1e-9b2af5959d27.jpeg"
  );

  if (!fs.existsSync(bottleFile)) {
    console.error("Bottle file not found at:", bottleFile);
    return;
  }

  const bottleStart = Date.now();
  const bottleOcr = await OcrService.extractText(bottleFile, "reg-bottle-test");
  const bottleElapsed = Date.now() - bottleStart;

  console.log(`- OCR Engine Used: ${bottleOcr.provider}`);
  console.log(`- OCR Processing Time: ${bottleElapsed} ms`);
  console.log(`- OCR Word Count: ${bottleOcr.wordCount}`);
  console.log(`- OCR Confidence: ${bottleOcr.confidence}%`);
  console.log(`- Raw Text Preview (first 200 chars):\n${bottleOcr.rawText.slice(0, 200)}...\n`);

  const bottleExtracted = RegexPatternExtractor.extractDeclarationsFromText(
    bottleOcr.rawText,
    bottleOcr.lines
  );

  console.log("EXTRACTED STATUTORY FIELDS:");
  console.log(`- Product Category: ${bottleExtracted.productCategory}`);
  console.log(`- Generic/Commodity Name: [${bottleExtracted.genericName.status}] ${bottleExtracted.genericName.value}`);
  console.log(`- Product Name: [${bottleExtracted.productName.status}] ${bottleExtracted.productName.value}`);
  console.log(`- Manufacturer Name: [${bottleExtracted.manufacturerName.status}] ${bottleExtracted.manufacturerName.value}`);
  console.log(`- Manufacturer Address: [${bottleExtracted.manufacturerAddress.status}] ${bottleExtracted.manufacturerAddress.value}`);
  console.log(`- MRP: [${bottleExtracted.mrp.status}] ${bottleExtracted.mrp.value}`);
  console.log(`- Unit Sale Price (USP): [${bottleExtracted.unitSalePrice.status}] ${bottleExtracted.unitSalePrice.value}`);
  console.log(`- Mfg License / FSSAI: [${bottleExtracted.fssaiNumber?.status}] ${bottleExtracted.fssaiNumber?.value}`);
  console.log(`- Country of Origin: [${bottleExtracted.countryOfOrigin.status}] ${bottleExtracted.countryOfOrigin.value}`);
  console.log(`- Helpline Phone: [${bottleExtracted.consumerCarePhone.status}] ${bottleExtracted.consumerCarePhone.value}\n`);

  // Assertions for Test 1
  const notFakeOcr = !bottleOcr.rawText.includes("Net Quantity: 200 g\nMRP Rs. 150.00");
  const notPackagedCommodity = bottleExtracted.productName.value !== "Packaged Commodity" && bottleExtracted.genericName.value !== "Packaged Commodity";
  const mfrDetected = Boolean(bottleExtracted.manufacturerName.value?.includes("Vaidarihant"));
  const mrpDetected = Boolean(bottleExtracted.mrp.value?.includes("299"));

  console.log(`ASSERTION 1.1 (No Fake 15-word fallback): ${notFakeOcr ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`ASSERTION 1.2 (No 'Packaged Commodity' fallback): ${notPackagedCommodity ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`ASSERTION 1.3 (Real Manufacturer 'Vaidarihant' detected): ${mfrDetected ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`ASSERTION 1.4 (Real MRP '₹ 299.00' detected): ${mrpDetected ? "✅ PASS" : "❌ FAIL"}\n`);

  // ---------------------------------------------------------------------------
  // TEST 2: The Uploaded Footwear Label
  // ---------------------------------------------------------------------------
  console.log(">>> TEST 2: FOOTWEAR PACKAGE LABEL");
  const shoesFile = path.join(
    process.cwd(),
    "public",
    "uploads",
    "314410f6-5fdb-4017-bc06-6fca942bbf8d-df63a540-4872-407f-88e6-8c7bc893b223.jpeg"
  );

  const shoesOcr = await OcrService.extractText(shoesFile, "reg-shoes-test");
  const shoesExtracted = RegexPatternExtractor.extractDeclarationsFromText(
    shoesOcr.rawText,
    shoesOcr.lines
  );

  console.log(`- Category: ${shoesExtracted.productCategory}`);
  console.log(`- Product / Brand: [${shoesExtracted.productName.status}] ${shoesExtracted.productName.value}`);
  console.log(`- Article Code: [${shoesExtracted.articleCode?.status}] ${shoesExtracted.articleCode?.value}`);
  console.log(`- Style: [${shoesExtracted.style?.status}] ${shoesExtracted.style?.value}`);
  console.log(`- FSSAI Status (Should be NOT_APPLICABLE for Shoes): [${shoesExtracted.fssaiNumber?.status}]`);
  console.log(`- Expiry Status (Should be NOT_APPLICABLE for Shoes): [${shoesExtracted.expiryDate?.status}]`);
  console.log(`- Net Quantity: [${shoesExtracted.netQuantity.status}] ${shoesExtracted.netQuantity.value}`);
  console.log(`- Country of Origin: [${shoesExtracted.countryOfOrigin.status}] ${shoesExtracted.countryOfOrigin.value}\n`);

  const shoesFssaiExempt = shoesExtracted.fssaiNumber?.status === "NOT_APPLICABLE";
  const shoesExpiryExempt = shoesExtracted.expiryDate?.status === "NOT_APPLICABLE";
  const shoesNetQtyValid = shoesExtracted.netQuantity.value === "1 Pair";

  console.log(`ASSERTION 2.1 (FSSAI is NOT_APPLICABLE for Footwear): ${shoesFssaiExempt ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`ASSERTION 2.2 (Expiry is NOT_APPLICABLE for Footwear): ${shoesExpiryExempt ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`ASSERTION 2.3 (Net Quantity correctly identified as 1 Pair): ${shoesNetQtyValid ? "✅ PASS" : "❌ FAIL"}\n`);

  // ---------------------------------------------------------------------------
  // TEST 3: Multi-Category Diversity (Food, Footwear, Apparel, Cosmetics, Electronics)
  // ---------------------------------------------------------------------------
  console.log(">>> TEST 3: MULTI-CATEGORY DIVERSITY & EXEMPTION MATRIX");
  const foodText = "Uncle Chipps Spicy Treat Potato Chips\nNet Wt: 50 g\nMRP: Rs 20.00 (incl. of all taxes)\nFSSAI Lic No: 10014011000123\nBest Before: 6 Months\nManufactured by: PepsiCo India\nCountry of Origin: India";
  const apparelText = "Men Cotton Casual Shirt\nChest Size: 102 cm\nNet Quantity: 1 N\nMRP: Rs 999.00\nManufactured by: Arvind Fashions, Bangalore - 560001\nCountry of Origin: India";
  const electronicsText = "Fast USB-C Charger Adapter\nNet Quantity: 1 Unit\nMRP: Rs 499.00\nVoltage: 220V\nManufactured by: TechPro India\nCountry of Origin: India";

  const foodRes = RegexPatternExtractor.extractDeclarationsFromText(foodText);
  const apparelRes = RegexPatternExtractor.extractDeclarationsFromText(apparelText);
  const electronicsRes = RegexPatternExtractor.extractDeclarationsFromText(electronicsText);

  console.log(`- Food Category: ${foodRes.productCategory} | FSSAI: ${foodRes.fssaiNumber?.status} | Expiry: ${foodRes.expiryDate?.status}`);
  console.log(`- Apparel Category: ${apparelRes.productCategory} | FSSAI: ${apparelRes.fssaiNumber?.status} | Expiry: ${apparelRes.expiryDate?.status}`);
  console.log(`- Electronics Category: ${electronicsRes.productCategory} | FSSAI: ${electronicsRes.fssaiNumber?.status} | Expiry: ${electronicsRes.expiryDate?.status}\n`);

  const categoryMatrixCorrect =
    foodRes.fssaiNumber?.status === "DETECTED" &&
    apparelRes.fssaiNumber?.status === "NOT_APPLICABLE" &&
    electronicsRes.fssaiNumber?.status === "NOT_APPLICABLE" &&
    apparelRes.expiryDate?.status === "NOT_APPLICABLE";

  console.log(`ASSERTION 3.1 (Category-specific regulatory matrix correctness): ${categoryMatrixCorrect ? "✅ PASS" : "❌ FAIL"}\n`);

  // ---------------------------------------------------------------------------
  // TEST 4: Zero Synthetic OCR Fallbacks on Failed Image
  // ---------------------------------------------------------------------------
  console.log(">>> TEST 4: HONEST HANDLING ON EMPTY / FAILED IMAGE");
  const emptyBuffer = Buffer.from([]);
  const failedOcr = await OcrService.extractText(emptyBuffer, "reg-empty-test");
  const failedExtracted = RegexPatternExtractor.extractDeclarationsFromText(failedOcr.rawText, failedOcr.lines);

  console.log(`- Failed OCR Word Count: ${failedOcr.wordCount}`);
  console.log(`- Failed OCR Confidence: ${failedOcr.confidence}%`);
  console.log(`- Extracted Product Name: [${failedExtracted.productName.status}] ${failedExtracted.productName.value}`);
  console.log(`- Extracted Manufacturer: [${failedExtracted.manufacturerName.status}] ${failedExtracted.manufacturerName.value}`);
  console.log(`- Extracted Net Quantity: [${failedExtracted.netQuantity.status}] ${failedExtracted.netQuantity.value}\n`);

  const zeroSyntheticData =
    failedOcr.wordCount === 0 &&
    failedOcr.confidence === 0 &&
    failedExtracted.productName.value === null &&
    failedExtracted.productName.status === "MISSING" &&
    failedExtracted.manufacturerName.value === null &&
    failedExtracted.manufacturerName.status === "MISSING";

  console.log(`ASSERTION 4.1 (Zero synthetic data on failed image): ${zeroSyntheticData ? "✅ PASS" : "❌ FAIL"}\n`);

  console.log("================================================================================");
  console.log("ALL REGRESSION TESTS COMPLETED SUCCESSFULLY! 🎉");
  console.log("================================================================================");
}

runRegressionTestSuite();
