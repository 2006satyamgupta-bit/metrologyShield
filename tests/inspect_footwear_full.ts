import fs from "fs";
import path from "path";
import Tesseract from "tesseract.js";

async function inspectFootwearDetails() {
  const targetPath = path.join(process.cwd(), "public", "uploads", "8677058a-44dc-4991-9444-1bdeb2f216e5-fe884349-bfb9-478d-a142-a7f1346e2d3c.jpeg");
  console.log("Reading Footwear image:", targetPath);
  const res = await Tesseract.recognize(targetPath, "eng");
  console.log("=================================================");
  console.log("FULL RAW OCR OF FOOTWEAR LABEL:");
  console.log("=================================================");
  console.log(res.data.text);
  console.log("=================================================");
}

inspectFootwearDetails();
