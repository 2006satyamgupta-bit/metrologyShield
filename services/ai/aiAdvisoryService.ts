import { env } from "@/lib/config/env";
import { ComplianceResult, ExtractedProductDeclarations, ViolationRecord } from "@/types";

export class AiAdvisoryService {
  /**
   * Generates AI-assisted executive summary and legal guidance for non-compliant labels.
   */
  static async generateComplianceAdvice(
    productName: string,
    declarations: ExtractedProductDeclarations,
    complianceResult: ComplianceResult
  ): Promise<string> {
    const failedViolations = complianceResult.violations.filter(
      (v) => v.status === "VIOLATION" || v.status === "WARNING"
    );

    if (failedViolations.length === 0) {
      return `### Executive Legal Metrology Summary: Fully Compliant
The evaluated artwork for **${productName}** satisfies all mandatory statutory declarations specified under Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011. No enforcement penalties or notice vulnerabilities were detected.`;
    }

    // If AI API key is configured, generate personalized dynamic advisory
    if (env.AI_API_KEY && env.AI_API_KEY.trim() !== "") {
      try {
        const aiSummary = await this.callAiAdvisory(productName, failedViolations);
        if (aiSummary) return aiSummary;
      } catch (err) {
        console.warn("AI advisory generation failed, using built-in legal synthesizer:", err);
      }
    }

    // Built-in statutory synthesizer
    const issuesList = failedViolations
      .map(
        (v, i) =>
          `${i + 1}. **${v.ruleName}** (${v.statutoryReference}): ${v.legalExplanation}\n   - **Action Required:** ${v.recommendedCorrection}`
      )
      .join("\n\n");

    return `### Legal Metrology Regulatory Notice & Rectification Advice for **${productName}**

**Overall Risk Level:** ${complianceResult.overallStatus} (Statutory Compliance Rating: ${complianceResult.complianceScore}%)

**Key Statutory Non-Compliances Identified:**
${issuesList}

---
*Notice: Under Section 36 of the Legal Metrology Act, 2009, manufacturing, packing, or selling non-compliant packaged commodities carries penalties starting from ₹25,000 up to ₹1,00,000 or imprisonment for repeat violations. Rectify the above declarations before commercial batch release.*`;
  }

  private static async callAiAdvisory(
    productName: string,
    violations: ViolationRecord[]
  ): Promise<string | null> {
    const prompt = `You are a Senior Legal Metrology Consultant in India.
Provide a concise executive summary and clear, actionable label artwork rectification instructions for the product "${productName}".

Violations Identified under Legal Metrology (Packaged Commodities) Rules, 2011:
${violations
  .map(
    (v) =>
      `- Rule: ${v.ruleName} (${v.statutoryReference}) | Severity: ${v.severity} | Detected: ${v.detectedValue || "None"} | Issue: ${v.legalExplanation}`
  )
  .join("\n")}

Format the response in clean markdown with:
1. Executive Risk Summary
2. Priority Label Artwork Amendments (Exact text to print on packaging)
3. Statutory Penalty Warning under Section 36 of the Legal Metrology Act, 2009.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.AI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a regulatory packaging compliance advisor for Indian Legal Metrology.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) return null;
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  }
}
