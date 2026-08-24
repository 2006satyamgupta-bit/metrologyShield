import Tesseract from "tesseract.js";
import path from "path";

async function inspectUserNewImage() {
  const targetPath = path.join(process.cwd(), "public", "uploads", "80e47d58-93c6-42cd-85d9-63c3623ed08f-a97f7e13-ce27-455f-9d1e-9b2af5959d27.jpeg");
  console.log("Analyzing user image:", targetPath);

  const res = await Tesseract.recognize(targetPath, "eng");
  console.log("-----------------------------------------");
  console.log("RAW OCR TEXT:");
  console.log("-----------------------------------------");
  console.log(res.data.text);
  console.log("-----------------------------------------");
}

inspectUserNewImage();
