import Tesseract from "tesseract.js";

async function testDirectTesseract() {
  console.log("Testing direct Tesseract.recognize()...");
  const sampleText = "PRODUCT NAME: HERBAL SOAP\nNET WT: 125 g\nMRP Rs. 45.00 (incl. of all taxes)";
  console.log("Sample text to test:", sampleText);
  console.log("Tesseract loaded successfully");
}

testDirectTesseract();
