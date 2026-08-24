async function testHttpEndpoints() {
  console.log("=================================================");
  console.log("TESTING LIVE SERVER HTTP ROUTES & API ENDPOINTS");
  console.log("=================================================\n");

  const baseUrl = "http://localhost:3000";

  const routes = [
    { path: "/", desc: "Landing Page" },
    { path: "/dashboard", desc: "Audit Dashboard" },
    { path: "/analyze/new", desc: "New Label Analysis Wizard" },
    { path: "/history", desc: "Audit History" },
    { path: "/rules", desc: "Statutory Rulebook Explorer" },
    { path: "/about", desc: "Statutory Guidance & FAQ" },
    { path: "/login", desc: "Auditor Login & Switcher" },
    { path: "/api/dashboard/stats", desc: "Dashboard Stats API" },
    { path: "/api/analyze", desc: "Analyses List API" },
  ];

  for (const route of routes) {
    try {
      const res = await fetch(`${baseUrl}${route.path}`);
      if (res.status >= 200 && res.status < 400) {
        console.log(`✅ [${res.status}] ${route.desc} (${route.path})`);
      } else {
        console.error(`❌ [${res.status}] ${route.desc} (${route.path})`);
        process.exit(1);
      }
    } catch (err: any) {
      console.error(`❌ Error connecting to ${route.path}:`, err.message);
      process.exit(1);
    }
  }

  console.log("\n--- Testing Full End-to-End Upload & Analysis Flow via API ---");

  // Create a multipart form with image
  const formData = new FormData();
  const sampleImageContent = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );
  const blob = new Blob([sampleImageContent], { type: "image/png" });
  formData.append("file", blob, "test-packaged-item.png");
  formData.append("productName", "Apex Cashew Delights 250g");
  formData.append("userId", "auditor-live-test");

  const uploadRes = await fetch(`${baseUrl}/api/analyze`, {
    method: "POST",
    body: formData,
  });

  const uploadData = await uploadRes.json();
  if (!uploadData.success || !uploadData.data?.id) {
    console.error("❌ Upload & Analysis failed:", uploadData);
    process.exit(1);
  }

  console.log(`✅ Upload & Initial OCR/Extraction Succeeded! Analysis ID: ${uploadData.data.id}`);
  console.log(`   Product: ${uploadData.data.productName}`);
  console.log(`   Compliance Status: ${uploadData.data.complianceStatus}`);
  console.log(`   Compliance Score: ${uploadData.data.complianceScore}%`);

  const analysisId = uploadData.data.id;

  // Test GET analysis by ID
  const getRes = await fetch(`${baseUrl}/api/analyze/${analysisId}`);
  const getData = await getRes.json();
  if (getData.success && getData.data.id === analysisId) {
    console.log(`✅ GET /api/analyze/${analysisId} verified!`);
  } else {
    console.error(`❌ GET /api/analyze/${analysisId} failed`);
    process.exit(1);
  }

  // Test User Editing Fields & Authoritative Re-evaluation
  console.log("\n--- Testing User-in-the-loop Correction & Re-evaluation ---");
  const updateRes = await fetch(`${baseUrl}/api/analyze/${analysisId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "auditor-live-test",
      extractedFields: {
        productName: { fieldName: "productName", label: "Product", value: "Apex Cashew Delights 250g", status: "DETECTED", confidence: 1, isUserCorrected: true },
        genericName: { fieldName: "genericName", label: "Generic Name", value: "Roasted Cashews", status: "DETECTED", confidence: 1, isUserCorrected: true },
        manufacturerName: { fieldName: "manufacturerName", label: "Manufacturer", value: "Apex Foods Ltd", status: "DETECTED", confidence: 1, isUserCorrected: true },
        manufacturerAddress: { fieldName: "manufacturerAddress", label: "Address", value: "Sector 18, Gurgaon, Haryana - 122015", status: "DETECTED", confidence: 1, isUserCorrected: true },
        countryOfOrigin: { fieldName: "countryOfOrigin", label: "Origin", value: "India", status: "DETECTED", confidence: 1, isUserCorrected: true },
        netQuantity: { fieldName: "netQuantity", label: "Net Qty", value: "250 g", status: "DETECTED", confidence: 1, isUserCorrected: true },
        netQuantityUnit: { fieldName: "netQuantityUnit", label: "Unit", value: "g", status: "DETECTED", confidence: 1, isUserCorrected: true },
        netQuantityValue: { fieldName: "netQuantityValue", label: "Value", value: "250", status: "DETECTED", confidence: 1, isUserCorrected: true },
        mrp: { fieldName: "mrp", label: "MRP", value: "Rs. 350.00", status: "DETECTED", confidence: 1, isUserCorrected: true },
        mrpInclusiveTaxes: { fieldName: "mrpInclusiveTaxes", label: "Taxes", value: "incl. of all taxes", status: "DETECTED", confidence: 1, isUserCorrected: true },
        unitSalePrice: { fieldName: "unitSalePrice", label: "USP", value: "Rs. 1.40 / g", status: "DETECTED", confidence: 1, isUserCorrected: true },
        manufacturingDate: { fieldName: "manufacturingDate", label: "Mfg Date", value: "05/2024", status: "DETECTED", confidence: 1, isUserCorrected: true },
        packagingDate: { fieldName: "packagingDate", label: "Pkd Date", value: "05/2024", status: "DETECTED", confidence: 1, isUserCorrected: true },
        expiryDate: { fieldName: "expiryDate", label: "Expiry Date", value: "11/2024", status: "DETECTED", confidence: 1, isUserCorrected: true },
        consumerCareName: { fieldName: "consumerCareName", label: "Care Name", value: "Grievance Officer", status: "DETECTED", confidence: 1, isUserCorrected: true },
        consumerCareAddress: { fieldName: "consumerCareAddress", label: "Care Address", value: "Sector 18, Gurgaon - 122015", status: "DETECTED", confidence: 1, isUserCorrected: true },
        consumerCarePhone: { fieldName: "consumerCarePhone", label: "Care Phone", value: "1800-200-8899", status: "DETECTED", confidence: 1, isUserCorrected: true },
        consumerCareEmail: { fieldName: "consumerCareEmail", label: "Care Email", value: "care@apexfoods.in", status: "DETECTED", confidence: 1, isUserCorrected: true },
        otherDeclarations: [],
      },
    }),
  });

  const updateData = await updateRes.json();
  if (updateData.success && updateData.data.complianceStatus === "COMPLIANT") {
    console.log(`✅ Re-evaluation Succeeded! New Compliance Status: ${updateData.data.complianceStatus}, Score: ${updateData.data.complianceScore}%`);
  } else {
    console.error("❌ Re-evaluation failed:", updateData);
    process.exit(1);
  }

  // Verify dashboard stats reflects this new analysis
  const statsRes = await fetch(`${baseUrl}/api/dashboard/stats?userId=auditor-live-test`);
  const statsData = await statsRes.json();
  if (statsData.success && statsData.data.totalAnalyses >= 1) {
    console.log(`✅ Dashboard stats verified! Total Analyses: ${statsData.data.totalAnalyses}, Compliant: ${statsData.data.compliantCount}`);
  } else {
    console.error("❌ Dashboard stats verification failed:", statsData);
    process.exit(1);
  }

  console.log("\n=================================================");
  console.log("ALL LIVE SERVER END-TO-END VERIFICATIONS PASSED! 🎉");
  console.log("=================================================\n");
}

testHttpEndpoints().catch((err) => {
  console.error("Fatal error during HTTP test:", err);
  process.exit(1);
});
