import { RegexPatternExtractor } from "../services/ai/regexExtractor";
import { ComplianceEngine } from "../services/compliance/complianceEngine";

const userRawOcrText = `
Sf No. SE2.69 702
Cuowume omc
— Tropa Tami
Product SHOES Nonafacured and Packed By: Marketed By i
Arie Code: 2FD25872A02 | FRARAMINIK GRIER DUPARC TRARY
CHANG oust || 17. LG. ROAD, BANGALORE
Style -SMON20 AMHR TAMADU S581 ANA TAKA - 560001
= Imm
"| § s0s286 9155583
chs Lied In case of Customer Complaints Please Contact [v=] .
Mamum Retall Price Manager Customer Care,
fincsive of ll mes) 2 479900 The Above Marketer Address |
wo ses Ph 080-46465500 [7
Cosnry of erigha : INDIA Email: feedback@anvindfashions.com |
`;

console.log("Testing RegexPatternExtractor on user image OCR text...");
const extracted = RegexPatternExtractor.extractDeclarationsFromText(userRawOcrText);
console.log("Extracted Declarations:", JSON.stringify(extracted, null, 2));

const compliance = ComplianceEngine.evaluate("test-user-shoes", extracted, userRawOcrText);
console.log("Compliance Result:", JSON.stringify(compliance, null, 2));
