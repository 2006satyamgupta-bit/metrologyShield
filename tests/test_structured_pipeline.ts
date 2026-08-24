import fs from "fs";
import path from "path";
import { OcrService } from "../services/ocr/ocrService";
import { RegexPatternExtractor } from "../services/ai/regexExtractor";

async function testStructuredPipelineOnUserImage() {
  console.log("================================================================================");
  console.log("METROLOGYSHIELD — STRUCTURED OCR & CONTEXTUAL ENTITY EXTRACTION TEST");
  console.log("================================================================================\n");

  // Locate the user's uploaded WhatsApp body wash image
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const files = fs.readdirSync(uploadsDir);
  const userImage = files.find((f) => f.includes("80e47d58") || f.includes("WhatsApp") || f.endsWith(".jpeg") || f.endsWith(".png"));

  if (!userImage) {
    console.error("No user package image found in uploads directory.");
    return;
  }

  const imagePath = path.join(uploadsDir, userImage);
  console.log(`Analyzing uploaded package image: ${userImage}`);

  // Step 1: Execute OCR Extraction with Line & Word Bounding Boxes
  const ocrResult = await OcrService.extractText(imagePath, "test-structured-pipeline");

  console.log("\n--- [ 1. RAW OCR EXTRACTED TEXT ] ---");
  console.log(ocrResult.rawText);
  console.log(`\nOCR Word Count: ${ocrResult.wordCount}, Average Confidence: ${ocrResult.confidence}%`);
  console.log(`Total Structured Lines Detected: ${ocrResult.lines?.length || 0}`);

  // Step 2: Run Structured Contextual Extraction
  const declarations = RegexPatternExtractor.extractDeclarationsFromText(ocrResult.rawText, ocrResult.lines);

  console.log("\n================================================================================");
  console.log("--- [ 2. CANDIDATE EVALUATION & SELECTED VALUES PER FIELD ] ---");
  console.log("================================================================================\n");

  const fieldsToCheck = [
    "productName",
    "mrp",
    "mrpInclusiveTaxes",
    "unitSalePrice",
    "fssaiNumber",
    "batchNumber",
    "netQuantity",
    "netQuantityUnit",
    "manufacturingDate",
    "expiryDate",
    "manufacturerName",
    "manufacturerAddress",
    "countryOfOrigin",
    "consumerCarePhone",
    "consumerCareEmail",
  ];

  for (const fieldName of fieldsToCheck) {
    const field = (declarations as any)[fieldName];
    if (!field) continue;

    console.log(`\n📌 FIELD: [${field.label.toUpperCase()}] (${fieldName})`);
    console.log(`   Selected Value  : ${field.value ? `"${field.value}"` : "[ MISSING ]"}`);
    console.log(`   Status          : ${field.status}`);
    console.log(`   Confidence      : ${field.confidence}%`);
    console.log(`   Selection Reason: ${field.reasonForSelection || "N/A"}`);

    if (field.candidates && field.candidates.length > 0) {
      console.log(`   Candidate Values Evaluated (${field.candidates.length}):`);
      field.candidates.forEach((c: any, idx: number) => {
        const tag = c.isSelected ? "  ✓ [SELECTED]" : "  ✕ [REJECTED]";
        console.log(`     ${tag} "${c.normalizedValue}" (${c.confidence}%) -> ${c.reason}`);
      });
    } else {
      console.log(`   No candidates matched field criteria.`);
    }
  }

  console.log("\n================================================================================");
  console.log("VERIFICATION CHECKS:");
  console.log("================================================================================");

  // Assertions
  const mrpVal = declarations.mrp?.value;
  const isMrpCorrect = mrpVal === "₹ 299.00";
  console.log(`1. MRP correctly selected as ₹ 299.00 (NOT arbitrary year/date ₹ 2026.00): ${isMrpCorrect ? "✅ PASS" : `❌ FAIL (Got ${mrpVal})`}`);

  const licVal = declarations.fssaiNumber?.value;
  const isLicCorrect = Boolean(licVal && (licVal.includes("GC/1429") || licVal.includes("1429")));
  console.log(`2. Mfg Lic No detected as GC/1429: ${isLicCorrect ? "✅ PASS" : `❌ FAIL (Got ${licVal})`}`);

  const batchVal = declarations.batchNumber?.value;
  const isBatchNotCurrency = batchVal !== "RS";
  console.log(`3. Batch Number does NOT falsely extract 'RS': ${isBatchNotCurrency ? "✅ PASS" : `❌ FAIL (Got ${batchVal})`}`);

  const originVal = declarations.countryOfOrigin?.value;
  const isOriginIndia = Boolean(originVal && originVal.toUpperCase().includes("INDIA"));
  console.log(`4. Country of Origin detected as India: ${isOriginIndia ? "✅ PASS" : `❌ FAIL (Got ${originVal})`}`);

  const phoneVal = declarations.consumerCarePhone?.value;
  const isPhoneCorrect = Boolean(phoneVal && phoneVal.includes("63534"));
  console.log(`5. Customer Care Phone detected (+91 63534 89683): ${isPhoneCorrect ? "✅ PASS" : `❌ FAIL (Got ${phoneVal})`}`);
  console.log("================================================================================\n");
}

testStructuredPipelineOnUserImage();
