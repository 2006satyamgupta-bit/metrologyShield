import { z } from "zod";
import { env } from "@/lib/config/env";
import { RegexPatternExtractor } from "@/services/ai/regexExtractor";
import {
  ExtractedFieldItem,
  ExtractedProductDeclarations,
  FieldStatus,
  OcrLineBox,
} from "@/types";

const AiStructuredExtractionSchema = z.object({
  productName: z.string().nullable().optional(),
  genericName: z.string().nullable().optional(),
  manufacturerName: z.string().nullable().optional(),
  manufacturerAddress: z.string().nullable().optional(),
  packerName: z.string().nullable().optional(),
  packerAddress: z.string().nullable().optional(),
  importerName: z.string().nullable().optional(),
  importerAddress: z.string().nullable().optional(),
  countryOfOrigin: z.string().nullable().optional(),
  netQuantity: z.string().nullable().optional(),
  netQuantityUnit: z.string().nullable().optional(),
  netQuantityValue: z.string().nullable().optional(),
  mrp: z.string().nullable().optional(),
  mrpInclusiveTaxes: z.string().nullable().optional(),
  unitSalePrice: z.string().nullable().optional(),
  manufacturingDate: z.string().nullable().optional(),
  packagingDate: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  bestBefore: z.string().nullable().optional(),
  consumerCareName: z.string().nullable().optional(),
  consumerCareAddress: z.string().nullable().optional(),
  consumerCarePhone: z.string().nullable().optional(),
  consumerCareEmail: z.string().nullable().optional(),
  otherDeclarations: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
      })
    )
    .optional()
    .default([]),
});

export type AiStructuredExtraction = z.infer<typeof AiStructuredExtractionSchema>;

export class AiExtractionService {
  /**
   * Extract structured Legal Metrology fields from raw OCR text using AI with deterministic fallback.
   */
  static async extractStructuredFields(
    rawOcrText: string,
    lines?: OcrLineBox[]
  ): Promise<ExtractedProductDeclarations> {
    if (!rawOcrText || rawOcrText.trim().length === 0) {
      return RegexPatternExtractor.extractDeclarationsFromText("", lines);
    }

    // If AI API key is configured, invoke LLM
    if (env.AI_API_KEY && env.AI_API_KEY.trim() !== "") {
      try {
        const aiResult = await this.callAiProvider(rawOcrText);
        if (aiResult) {
          return this.mapAiOutputToDeclarations(aiResult, rawOcrText);
        }
      } catch (err) {
        console.warn("AI extraction call failed, falling back to deterministic regex parser:", err);
      }
    }

    // Default high-accuracy deterministic extraction
    return RegexPatternExtractor.extractDeclarationsFromText(rawOcrText, lines);
  }

  private static async callAiProvider(
    rawOcrText: string
  ): Promise<AiStructuredExtraction | null> {
    const prompt = `You are a specialized Legal Metrology compliance parser.
Extract all statutory packaged commodity declarations from the following raw OCR text into structured JSON.
According to the Indian Legal Metrology (Packaged Commodities) Rules, 2011, identify:
- Product name / Brand
- Generic or common name of the commodity
- Manufacturer name & full address (including city, state, PIN code)
- Packer name & address (if separate)
- Importer name & address (if imported)
- Country of origin
- Net quantity (e.g. 250 g, 1 kg, 500 ml)
- Net quantity unit (e.g. g, kg, ml, l)
- Net quantity numeric value
- MRP (Maximum Retail Price)
- Whether MRP explicitly includes "incl. of all taxes" / "inclusive of all taxes"
- Unit Sale Price (USP)
- Month and Year of Manufacture / Packing / Import
- Expiry / Best Before date
- Consumer care details: Name/Cell, Postal Address, Phone number, Email address
- Any other specific declarations.

Return ONLY a valid JSON object matching the requested schema. If a field is not found in the text, set its value to null.

Raw OCR Text:
"""
${rawOcrText}
"""`;

    // OpenAI-compatible Chat Completion API with fast 4-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

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
            content:
              "You are an expert AI parser for Indian Legal Metrology compliance. Respond only in strict JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      throw new Error(`OpenAI API returned status ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsedJson = JSON.parse(content);
    const validated = AiStructuredExtractionSchema.safeParse(parsedJson);

    if (validated.success) {
      return validated.data;
    } else {
      console.warn("AI output validation failed against Zod schema:", validated.error);
      return null;
    }
  }

  private static mapAiOutputToDeclarations(
    aiData: AiStructuredExtraction,
    rawText: string
  ): ExtractedProductDeclarations {
    const makeItem = (
      fieldName: string,
      label: string,
      val: string | null | undefined,
      legalRef: string,
      desc: string
    ): ExtractedFieldItem => {
      const value = val && val.trim().length > 0 ? val.trim() : null;
      const status: FieldStatus = value ? "DETECTED" : "MISSING";
      return {
        fieldName,
        label,
        value,
        status,
        confidence: value ? 0.95 : 0.0,
        isUserCorrected: false,
        legalReference: legalRef,
        description: desc,
        sourceTextSnippet: value ? `AI Extracted: "${value}"` : undefined,
      };
    };

    return {
      productName: makeItem(
        "productName",
        "Product Name / Brand",
        aiData.productName,
        "Rule 6(1)(b)",
        "Name of the product or brand display"
      ),
      genericName: makeItem(
        "genericName",
        "Generic or Common Name",
        aiData.genericName || aiData.productName,
        "Rule 6(1)(b)",
        "Statutory common or generic description of commodity"
      ),
      manufacturerName: makeItem(
        "manufacturerName",
        "Manufacturer Name",
        aiData.manufacturerName,
        "Rule 6(1)(a)",
        "Name of the legal manufacturing entity"
      ),
      manufacturerAddress: makeItem(
        "manufacturerAddress",
        "Manufacturer Complete Postal Address",
        aiData.manufacturerAddress,
        "Rule 6(1)(a)",
        "Complete physical postal address with PIN code"
      ),
      countryOfOrigin: makeItem(
        "countryOfOrigin",
        "Country of Origin",
        aiData.countryOfOrigin,
        "Rule 6(1)(a) & Rule 27",
        "Nation of manufacture or assembly"
      ),
      netQuantity: makeItem(
        "netQuantity",
        "Net Quantity Declaration",
        aiData.netQuantity,
        "Rule 6(1)(c) & Rule 11",
        "Stated quantity of package contents"
      ),
      netQuantityUnit: makeItem(
        "netQuantityUnit",
        "Net Quantity Unit",
        aiData.netQuantityUnit,
        "Rule 13",
        "Standard SI metric unit (kg, g, L, ml, etc.)"
      ),
      netQuantityValue: makeItem(
        "netQuantityValue",
        "Net Quantity Numerical Value",
        aiData.netQuantityValue,
        "Rule 11",
        "Numerical metric measurement"
      ),
      mrp: makeItem(
        "mrp",
        "Maximum Retail Price (MRP)",
        aiData.mrp,
        "Rule 6(1)(e) & Rule 2(m)",
        "Retail price in Indian Rupees"
      ),
      mrpInclusiveTaxes: makeItem(
        "mrpInclusiveTaxes",
        "MRP Tax Inclusivity Declaration",
        aiData.mrpInclusiveTaxes,
        "Rule 6(1)(e)",
        "Explicit statement 'inclusive of all taxes'"
      ),
      unitSalePrice: makeItem(
        "unitSalePrice",
        "Unit Sale Price (USP)",
        aiData.unitSalePrice,
        "Rule 6(1)(g)",
        "Price per unit weight/measure"
      ),
      manufacturingDate: makeItem(
        "manufacturingDate",
        "Date of Manufacture / Packing",
        aiData.manufacturingDate || aiData.packagingDate,
        "Rule 6(1)(d)",
        "Month and year of manufacture or packaging"
      ),
      packagingDate: makeItem(
        "packagingDate",
        "Packaging Date",
        aiData.packagingDate || aiData.manufacturingDate,
        "Rule 6(1)(d)",
        "Month and year of packing"
      ),
      expiryDate: makeItem(
        "expiryDate",
        "Expiry / Best Before Date",
        aiData.expiryDate || aiData.bestBefore,
        "Rule 10",
        "Best before or expiry timeframe"
      ),
      consumerCareName: makeItem(
        "consumerCareName",
        "Consumer Care Officer / Cell",
        aiData.consumerCareName,
        "Rule 6(1)(f)",
        "Contact person or department for customer grievances"
      ),
      consumerCareAddress: makeItem(
        "consumerCareAddress",
        "Consumer Care Postal Address",
        aiData.consumerCareAddress || aiData.manufacturerAddress,
        "Rule 6(1)(f)",
        "Postal address for consumer complaints"
      ),
      consumerCarePhone: makeItem(
        "consumerCarePhone",
        "Consumer Care Phone / Helpline",
        aiData.consumerCarePhone,
        "Rule 6(1)(f)",
        "Telephone or toll-free helpline number"
      ),
      consumerCareEmail: makeItem(
        "consumerCareEmail",
        "Consumer Care Email Address",
        aiData.consumerCareEmail,
        "Rule 6(1)(f)",
        "Email address for customer grievances"
      ),
      otherDeclarations: (aiData.otherDeclarations || []).map((o) => ({
        fieldName: o.key,
        label: o.key,
        value: o.value,
        status: "DETECTED" as FieldStatus,
        confidence: 0.85,
        isUserCorrected: false,
      })),
    };
  }
}
