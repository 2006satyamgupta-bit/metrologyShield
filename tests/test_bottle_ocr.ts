import Tesseract from "tesseract.js";
import path from "path";
import fs from "fs";

async function testBottleImage() {
  const file = "80e47d58-93c6-42cd-85d9-63c3623ed08f-a97f7e13-ce27-455f-9d1e-9b2af5959d27.jpeg";
  const filePath = path.join(process.cwd(), "public", "uploads", file);
  console.log("Analyzing file:", filePath);

  const startTime = Date.now();
  const res = await Tesseract.recognize(filePath, "eng", {
    langPath: path.join(process.cwd(), "public"),
  });
  const elapsed = Date.now() - startTime;

  console.log("------------------- OCR RESULT -------------------");
  console.log("Processing Time:", elapsed, "ms");
  console.log("Confidence:", res.data.confidence);
  console.log("Word Count:", (res.data.words || []).length);
  console.log("Raw Text:\n", res.data.text);
  console.log("--------------------------------------------------");
}

testBottleImage();
