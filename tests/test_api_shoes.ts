import fs from "fs";
import path from "path";

async function testApiShoes() {
  const filePath = path.join(
    process.cwd(),
    "public",
    "uploads",
    "314410f6-5fdb-4017-bc06-6fca942bbf8d-df63a540-4872-407f-88e6-8c7bc893b223.jpeg"
  );
  const fileBuffer = fs.readFileSync(filePath);

  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: "image/jpeg" });
  formData.append("files", blob, "shoes.jpeg");
  formData.append("productName", "");
  formData.append("userId", "default-user");

  console.log("Sending Shoes POST /api/analyze to http://localhost:3000 ...");
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
    ocrConfidence: data.data?.ocrResult?.confidence,
    extractedCategory: data.data?.extractedFields?.productCategory,
    extractedProductName: data.data?.extractedFields?.productName?.value,
    extractedBrand: data.data?.extractedFields?.brandName?.value,
    extractedArticleCode: data.data?.extractedFields?.articleCode?.value,
    extractedStyle: data.data?.extractedFields?.style?.value,
    extractedNetQty: data.data?.extractedFields?.netQuantity?.value,
    extractedFssaiStatus: data.data?.extractedFields?.fssaiNumber?.status,
    extractedExpiryStatus: data.data?.extractedFields?.expiryDate?.status,
    extractedCoo: data.data?.extractedFields?.countryOfOrigin?.value,
  });
}

testApiShoes();
