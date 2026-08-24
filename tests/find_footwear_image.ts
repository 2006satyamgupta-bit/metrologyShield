import fs from "fs";
import path from "path";
import Tesseract from "tesseract.js";

async function inspectAllUploadedImages() {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const files = fs.readdirSync(uploadsDir);
  console.log(`Found ${files.length} uploaded files in public/uploads:`);

  for (const f of files) {
    if (f.endsWith(".png") || f.endsWith(".jpeg") || f.endsWith(".jpg")) {
      const fullPath = path.join(uploadsDir, f);
      const res = await Tesseract.recognize(fullPath, "eng");
      const txt = (res.data.text || "").trim();
      console.log("=================================================");
      console.log(`FILE: ${f}`);
      console.log("RAW OCR PREVIEW (first 250 chars):");
      console.log(txt.slice(0, 250));
      console.log("-------------------------------------------------");
    }
  }
}

inspectAllUploadedImages();
