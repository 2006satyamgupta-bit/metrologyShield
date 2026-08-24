import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";
import { RegexPatternExtractor } from "../services/ai/regexExtractor";
import { ComplianceEngine } from "../services/compliance/complianceEngine";
import { AnalysisRecord } from "../types";

async function testPdfGeneration() {
  console.log("Testing PDF Certificate Generation with jsPDF...");

  const mockDeclarations = RegexPatternExtractor.extractDeclarationsFromText(`
Product SHOES
Arie Code: 2FD25872A02
Style -SMON20
BEIGE
Foot Length: 27.20 cm
1 Pair
Maximum Retail Price (inclusive of all taxes) 4799.00
11/2025
Country of origin: INDIA
Marketed By Arvind Fashions Limited, 17, M.G. Road, Bangalore - 560001
Customer Care: Ph 080-46465500, Email: feedback@arvindfashions.com
  `);

  const mockCompliance = ComplianceEngine.evaluate("test-pdf-analysis", mockDeclarations, "Product SHOES");

  const mockAnalysis: AnalysisRecord = {
    id: "test-pdf-12345-67890",
    userId: "default-user",
    productName: "USPA Men's Shoes",
    status: "COMPLETED",
    complianceScore: mockCompliance.complianceScore,
    complianceStatus: mockCompliance.overallStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    extractedFields: mockDeclarations,
    complianceResult: mockCompliance,
  };

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  doc.text("METROLOGYSHIELD OFFICIAL AUDIT CERTIFICATE", 14, 20);
  doc.text(`SKU: ${mockAnalysis.productName}`, 14, 30);
  doc.text(`Status: ${mockAnalysis.complianceStatus} (${mockAnalysis.complianceScore}%)`, 14, 40);

  const arrayBuffer = doc.output("arraybuffer");
  const outputPath = path.join(process.cwd(), "scratch", "test_output.pdf");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));

  console.log(`✅ PDF generated successfully: ${outputPath} (${arrayBuffer.byteLength} bytes)`);
}

testPdfGeneration();
