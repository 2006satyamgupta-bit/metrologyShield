import { RegexPatternExtractor } from "../services/ai/regexExtractor";

function testDiverseProducts() {
  console.log("================================================================================");
  console.log("VERIFYING MULTI-PRODUCT DYNAMIC EXTRACTION DIVERSITY");
  console.log("================================================================================\n");

  // Product 1: Potato Chips (Food & Beverage)
  const chipsText = `
Uncle Chipps Spicy Treat Potato Chips
Net Wt: 50 g
MRP: Rs 20.00 (inclusive of all taxes)
Unit Sale Price: Rs 0.40 / g
Mfd: 01/2026
Exp: 07/2026
FSSAI Lic No: 10014011000123
Country of Origin: INDIA
Manufactured by: PepsiCo India Holdings Pvt Ltd, DLF Cyber City, Gurgaon - 122001, Haryana
Customer Care: 1800-22-4020
Email: feedback@pepsico.com
  `;

  const chipsResult = RegexPatternExtractor.extractDeclarationsFromText(chipsText);
  console.log("--- PRODUCT 1: POTATO CHIPS ---");
  console.log(`Category: ${chipsResult.productCategory}`);
  console.log(`Product Name: ${chipsResult.productName.value}`);
  console.log(`Net Quantity: ${chipsResult.netQuantity.value}`);
  console.log(`MRP: ${chipsResult.mrp.value}`);
  console.log(`FSSAI: ${chipsResult.fssaiNumber?.value}`);
  console.log(`Mfr: ${chipsResult.manufacturerName.value}`);
  console.log(`Phone: ${chipsResult.consumerCarePhone.value}`);
  console.log(`Email: ${chipsResult.consumerCareEmail.value}\n`);

  // Product 2: Tulsi Green Tea (Food & Beverage)
  const teaText = `
Product: TULSI GREEN TEA
Organic Wellness Tea
Net Quantity: 100 g
Maximum Retail Price: Rs 174/- (incl. of all taxes)
Mfg Date: 08/2025
Best Before: 24 months
FSSAI License: 10012051000100
Country of Origin: India
Manufactured & Packed by: Organic India Pvt Ltd, Plot No 266, Barabanki - 225001, Uttar Pradesh
For Consumer Complaints: Tel 1800-180-1234, Email care@organicindia.com
  `;

  const teaResult = RegexPatternExtractor.extractDeclarationsFromText(teaText);
  console.log("--- PRODUCT 2: TULSI GREEN TEA ---");
  console.log(`Category: ${teaResult.productCategory}`);
  console.log(`Product Name: ${teaResult.productName.value}`);
  console.log(`Net Quantity: ${teaResult.netQuantity.value}`);
  console.log(`MRP: ${teaResult.mrp.value}`);
  console.log(`FSSAI: ${teaResult.fssaiNumber?.value}`);
  console.log(`Mfr: ${teaResult.manufacturerName.value}`);
  console.log(`Phone: ${teaResult.consumerCarePhone.value}`);
  console.log(`Email: ${teaResult.consumerCareEmail.value}\n`);

  // Product 3: USPA Shoes (Footwear)
  const footwearText = `
Product SHOES
Arie Code: 2FD25872A02
Style -SMON20
BEIGE
Foot Length: 27.20 cm
1 Pair
Maximum Retail Price (inclusive of all taxes) 479900
11/2025
Country of origin: INDIA
Marketed By Arvind Fashions Limited, 17, M.G. Road, Bangalore - 560001
Customer Care: Ph 080-46465500, Email: feedback@arvindfashions.com
  `;

  const footwearResult = RegexPatternExtractor.extractDeclarationsFromText(footwearText);
  console.log("--- PRODUCT 3: FOOTWEAR ---");
  console.log(`Category: ${footwearResult.productCategory}`);
  console.log(`Product Name: ${footwearResult.productName.value}`);
  console.log(`Brand: ${footwearResult.brandName?.value}`);
  console.log(`Article: ${footwearResult.articleCode?.value}`);
  console.log(`Net Quantity: ${footwearResult.netQuantity.value}`);
  console.log(`MRP: ${footwearResult.mrp.value}`);
  console.log(`FSSAI: ${footwearResult.fssaiNumber?.status} (${footwearResult.fssaiNumber?.value})`);
  console.log(`Mfr Address: ${footwearResult.manufacturerAddress.value}`);
  console.log(`Phone: ${footwearResult.consumerCarePhone.value}`);
  console.log(`Email: ${footwearResult.consumerCareEmail.value}\n`);

  console.log("================================================================================");
  console.log("ASSERTIONS FOR PRODUCT DIVERSITY:");
  console.log("================================================================================");

  const chipsDistinct = chipsResult.productName.value !== "Packaged Commodity" && chipsResult.productName.value !== footwearResult.productName.value;
  console.log(`1. Chips product name is unique and NOT 'Packaged Commodity': ${chipsDistinct ? "✅ PASS" : "❌ FAIL"}`);

  const teaDistinct = teaResult.productName.value === "TULSI GREEN TEA";
  console.log(`2. Tea product name is 'TULSI GREEN TEA': ${teaDistinct ? "✅ PASS" : "❌ FAIL"}`);

  const fssaiDifferent = chipsResult.fssaiNumber?.value !== teaResult.fssaiNumber?.value;
  console.log(`3. FSSAI numbers are distinct across products: ${fssaiDifferent ? "✅ PASS" : "❌ FAIL"}`);

  const phonesDifferent = chipsResult.consumerCarePhone.value !== footwearResult.consumerCarePhone.value;
  console.log(`4. Customer Care phone numbers are unique to each product: ${phonesDifferent ? "✅ PASS" : "❌ FAIL"}`);

  const mfrDifferent = chipsResult.manufacturerName.value !== teaResult.manufacturerName.value;
  console.log(`5. Manufacturers are unique to each product: ${mfrDifferent ? "✅ PASS" : "❌ FAIL"}`);
  console.log("================================================================================\n");
}

testDiverseProducts();
