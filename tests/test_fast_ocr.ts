import Tesseract from "tesseract.js";
import path from "path";
import fs from "fs";

async function testFastOcr() {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const files = fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir) : [];
  const jpegFile = files.find((f) => f.endsWith(".jpeg") || f.endsWith(".jpg") || f.endsWith(".png"));

  if (jpegFile) {
    const targetPath = path.join(uploadDir, jpegFile);
    console.log("Testing OCR on:", targetPath);
    const start = Date.now();

    // Direct recognition
    const res = await Tesseract.recognize(targetPath, "eng");
    console.log(`Recognition completed in ${Date.now() - start}ms`);
    console.log("Text preview:", res.data.text.slice(0, 150));
  }
}

testFastOcr();
