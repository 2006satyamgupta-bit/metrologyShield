import Tesseract from "tesseract.js";
import path from "path";
import fs from "fs";

async function testTesseractRecognition() {
  console.log("Starting Tesseract recognition on sample uploaded file...");
  
  // Find any image in public/uploads if exists
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const files = fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir) : [];
  console.log("Files in uploads dir:", files);

  if (files.length > 0) {
    const targetPath = path.join(uploadDir, files[0]);
    console.log("Testing on file:", targetPath);
    try {
      const res = await Tesseract.recognize(targetPath, "eng", {
        logger: (m) => console.log("Tesseract log:", m.status, m.progress),
      });
      console.log("Recognized text:", res.data.text);
      console.log("Confidence:", res.data.confidence);
    } catch (err) {
      console.error("Recognition failed:", err);
    }
  }
}

testTesseractRecognition();
