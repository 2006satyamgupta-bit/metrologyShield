import { RegexPatternExtractor } from "../services/ai/regexExtractor";

const shoesOcr = `
Product SHOES Nonafacured and Packed By: Marketed By i
CHANG oust || 17. LG. ROAD, BANGALORE
Style -SMON20 AMHR TAMADU S581 ANA TAKA - 560001
Net Qty: 1 Pair
Maximum Retail Price: (inclusive of all taxes) ₹ 4799.00
Ph 080-46465500
Email: feedback@arvindfashions.com
Country of Origin : INDIA
`;

const bodyWashOcr = `
Manufactured by:
GA Vaidarihant Pharmaceuticals
2-3 Supreme Estate, Naroda, Ahmedabad-382330.
Origin INDIA
Commodity : Body Wash
Customer Care : 016353489683
Mail info.getnectar@gmail.com
MRP Rs. 299/- (incl. of all taxes)
Net Vol: 200 ml
EXP MAY 2025
`;

console.log("--- SHOES EXTRACTION ---");
const shoesExtracted = RegexPatternExtractor.extractDeclarationsFromText(shoesOcr);
console.log("Product Name:", shoesExtracted.productName.value);
console.log("Net Qty:", shoesExtracted.netQuantity.value);
console.log("MRP:", shoesExtracted.mrp.value);
console.log("Country of Origin:", shoesExtracted.countryOfOrigin.value);
console.log("Phone:", shoesExtracted.consumerCarePhone.value);
console.log("Email:", shoesExtracted.consumerCareEmail.value);

console.log("\n--- BODY WASH EXTRACTION ---");
const bwExtracted = RegexPatternExtractor.extractDeclarationsFromText(bodyWashOcr);
console.log("Product Name:", bwExtracted.productName.value);
console.log("Net Qty:", bwExtracted.netQuantity.value);
console.log("MRP:", bwExtracted.mrp.value);
console.log("Mfg/Exp Date:", bwExtracted.expiryDate?.value);
console.log("Manufacturer:", bwExtracted.manufacturerName.value);
console.log("Address:", bwExtracted.manufacturerAddress.value);
