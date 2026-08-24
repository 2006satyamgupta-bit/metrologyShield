import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), ".data", "analyses_db.json");
const data = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
const record = data.analyses["03f93cf6-d8e9-4987-a576-9dbfae1979ce"] || data.analyses["dbe7c780-3c68-403d-ac6d-1c90e92709b1"];

console.log("=========================================");
console.log("FULL RAW OCR TEXT OF USER'S WHATSAPP IMAGE:");
console.log("=========================================");
console.log(record?.ocrResult?.rawText);
console.log("=========================================");
console.log("CURRENT EXTRACTED FIELDS:");
console.log(JSON.stringify(record?.extractedFields, null, 2));
