import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), ".data", "analyses_db.json");
const data = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
const records = Object.values(data.analyses || {}) as any[];

// Sort descending by createdAt
records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

console.log(`Total records in DB: ${records.length}`);
for (const r of records.slice(0, 5)) {
  console.log("-----------------------------------------");
  console.log(`ID: ${r.id}`);
  console.log(`Product Name: ${r.productName}`);
  console.log(`Created: ${r.createdAt}`);
  console.log(`Compliance Status: ${r.complianceStatus}, Score: ${r.complianceScore}`);
  console.log("Raw OCR snippet:", (r.ocrResult?.rawText || "").slice(0, 200));
  console.log("Extracted Fields Summary:", {
    productName: r.extractedFields?.productName?.value,
    genericName: r.extractedFields?.genericName?.value,
    netQuantity: r.extractedFields?.netQuantity?.value,
    mrp: r.extractedFields?.mrp?.value,
    mfrAddress: r.extractedFields?.manufacturerAddress?.value,
    origin: r.extractedFields?.countryOfOrigin?.value,
    phone: r.extractedFields?.consumerCarePhone?.value,
    email: r.extractedFields?.consumerCareEmail?.value,
    mfgDate: r.extractedFields?.manufacturingDate?.value,
    expiryDate: r.extractedFields?.expiryDate?.value,
  });
}
