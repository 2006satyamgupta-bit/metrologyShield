import Tesseract from "tesseract.js";
import path from "path";

async function testUserFile() {
  const targetPath = path.join(process.cwd(), "public", "uploads", "bde5ac4e-de08-4eb7-9c8a-0121fc217483-7412e852-338a-4905-9182-25398af89c7f.jpeg");
  console.log("Testing user uploaded file:", targetPath);
  try {
    const res = await Tesseract.recognize(targetPath, "eng", {
      logger: (m) => console.log("Tesseract status:", m.status),
    });
    console.log("-----------------------------------------");
    console.log("RAW TEXT EXTRACTED FROM USER IMAGE:");
    console.log("-----------------------------------------");
    console.log(res.data.text);
    console.log("-----------------------------------------");
    console.log("Confidence:", res.data.confidence);
  } catch (err) {
    console.error("Error:", err);
  }
}

testUserFile();
