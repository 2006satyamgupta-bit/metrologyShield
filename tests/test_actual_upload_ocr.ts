import Tesseract from "tesseract.js";
import path from "path";
import { RegexPatternExtractor } from "../services/ai/regexExtractor";

async function testUserImage() {
  const filePath = path.join(
    process.cwd(),
    "public",
    "uploads",
    "314410f6-5fdb-4017-bc06-6fca942bbf8d-df63a540-4872-407f-88e6-8c7bc893b223.jpeg"
  );
  console.log("Analyzing file:", filePath);

  const res = await Tesseract.recognize(filePath, "eng");
  const rawText = res.data.text || "";
  console.log("------------------- RAW OCR TEXT -------------------");
  console.log(rawText);
  console.log("-----------------------------------------------------");

  const lines = (res.data.lines || []).map((l: any, idx: number) => ({
    lineIndex: idx,
    text: l.text?.trim() || "",
    confidence: Math.round(l.confidence || 80),
  }));

  const extracted = RegexPatternExtractor.extractDeclarationsFromText(rawText, lines);
  console.log("----------------- EXTRACTED FIELDS -----------------");
  console.log("Product Category:", extracted.productCategory);
  console.log("Product Name:", extracted.productName);
  console.log("Generic Name:", extracted.genericName);
  console.log("Brand Name:", extracted.brandName);
  console.log("Article Code:", extracted.articleCode);
  console.log("Style:", extracted.style);
  console.log("Colour:", extracted.colour);
  console.log("Net Qty:", extracted.netQuantity);
  console.log("MRP:", extracted.mrp);
  console.log("MRP Inclusive:", extracted.mrpInclusiveTaxes);
  console.log("Country of Origin:", extracted.countryOfOrigin);
  console.log("MFD:", extracted.manufacturingDate);
  console.log("Manufacturer Name:", extracted.manufacturerName);
  console.log("Manufacturer Address:", extracted.manufacturerAddress);
  console.log("Consumer Care Phone:", extracted.consumerCarePhone);
  console.log("Consumer Care Email:", extracted.consumerCareEmail);
}

testUserImage();
