import fs from "fs";
import path from "path";

async function testApiEndpoint() {
  const filePath = path.join(
    process.cwd(),
    "public",
    "uploads",
    "80e47d58-93c6-42cd-85d9-63c3623ed08f-a97f7e13-ce27-455f-9d1e-9b2af5959d27.jpeg"
  );
  const fileBuffer = fs.readFileSync(filePath);

  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: "image/jpeg" });
  formData.append("files", blob, "bottle.jpeg");
  formData.append("productName", "");
  formData.append("userId", "default-user");

  console.log("Sending POST /api/analyze to http://localhost:3000 ...");
  const startTime = Date.now();
  const res = await fetch("http://localhost:3000/api/analyze", {
    method: "POST",
    body: formData,
  });

  const elapsed = Date.now() - startTime;
  console.log(`Response Status: ${res.status} (${elapsed} ms)`);
  const data = await res.json();
  console.log("Response Body Summary:", {
    success: data.success,
    id: data.data?.id,
    productName: data.data?.productName,
    ocrWordCount: data.data?.ocrResult?.wordCount,
    ocrConfidence: data.data?.ocrResult?.confidence,
    extractedProductName: data.data?.extractedFields?.productName?.value,
    extractedGenericName: data.data?.extractedFields?.genericName?.value,
    extractedManufacturer: data.data?.extractedFields?.manufacturerName?.value,
    extractedMrp: data.data?.extractedFields?.mrp?.value,
    extractedCoo: data.data?.extractedFields?.countryOfOrigin?.value,
  });
}

testApiEndpoint();
