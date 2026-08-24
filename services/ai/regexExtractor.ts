import {
  ExtractedFieldItem,
  ExtractedProductDeclarations,
  FieldStatus,
  OcrLineBox,
  ProductCategory,
} from "@/types";
import { ContextualParsers } from "./contextualParsers";

export class RegexPatternExtractor {
  static extractDeclarationsFromText(
    rawText: string,
    rawLines?: OcrLineBox[],
    overrideCategory?: ProductCategory
  ): ExtractedProductDeclarations {
    const text = rawText || "";
    const cleanText = ContextualParsers.sanitizeText(text);

    // Build synthetic lines if rawLines not provided
    const lines: OcrLineBox[] =
      rawLines && rawLines.length > 0
        ? rawLines
        : text
            .split("\n")
            .map((l, idx) => ({
              lineIndex: idx,
              text: l.trim(),
              confidence: 85,
            }))
            .filter((l) => Boolean(l.text));

    // 0. Classify Product Category dynamically
    const category: ProductCategory =
      overrideCategory || ContextualParsers.classifyCategory(cleanText);

    // 1. Dynamic Product & Generic Name
    const parsedNames = ContextualParsers.parseProductName(lines, cleanText, category);

    // 2. MRP & Inclusivity
    const parsedMrp = ContextualParsers.parseMrp(lines, cleanText);
    const hasTaxInclusivity = Boolean(
      cleanText.match(/(?:inclusive\s*of\s*all\s*taxes|incl\.\s*of\s*all\s*taxes|incl\.\s*taxes|fincsive\s*of\s*ll\s*mes|fincsive)/i) ||
      cleanText.match(/mrp[\s\S]{0,60}?(?:incl|inclusive|fincsive)/i)
    );

    // 3. Net Quantity & Units (Category aware)
    const parsedQty = ContextualParsers.parseNetQuantity(lines, cleanText, category);

    // 4. FSSAI & Mfg License (Category aware)
    const parsedLic = ContextualParsers.parseLicense(lines, cleanText, category);

    // 5. Batch / Lot Number
    const parsedBatch = ContextualParsers.parseBatchNumber(lines, cleanText);

    // 6. Manufacturing & Expiry Dates (Category aware)
    const parsedDates = ContextualParsers.parseDates(lines, cleanText, category);

    // 7. Manufacturer & Address
    const parsedMfr = ContextualParsers.parseManufacturer(lines, cleanText);

    // 8. Consumer Care Details
    const parsedCare = ContextualParsers.parseConsumerCare(lines, cleanText);

    // 9. Footwear & Apparel Specifics (Only if Category matches)
    const footwearFields =
      category === "FOOTWEAR" || category === "APPAREL"
        ? ContextualParsers.parseFootwearSpecifics(lines, cleanText)
        : {};

    // 10. Unit Sale Price (USP)
    const uspMatch = cleanText.match(
      /(?:UNIT\s*(?:SALE)?\s*PRICE|USP|USPT)[:\s-]*([₹Rs.]*\s*[0-9]+(?:\.[0-9]{1,2})?\s*(?:\/|per)?\s*[a-zA-Z0-9]*)/i
    );

    // 11. Country of Origin
    const cooMatch = cleanText.match(
      /(?:COUNTRY\s*OF\s*(?:ORIGIN|ERIGHA|ORIGHA)|MADE\s*IN|PRODUCT\s*OF|ORIGIN|Cosnry\s*of\s*erigha|Origin)[:\s-]*([A-Za-z\s]+?)(?:[,\n.|]|$)/i
    );
    const hasIndiaMention = cleanText.match(/\b(INDIA|MADE IN INDIA|PRODUCT OF INDIA)\b/i);
    const originVal = cooMatch ? cooMatch[1].trim() : hasIndiaMention ? "India" : null;

    // 12. Description & Ingredients
    const descMatch = cleanText.match(
      /(?:Description|Product\s*Description|About\s*Product|Details)[:\s-]*([^\n]+(?:\n[^\n]+){0,2})/i
    );
    const ingredientsMatch = cleanText.match(
      /(?:Ingredients|Composition|Contains)[:\s-]*([^\n]+(?:\n[^\n]+){0,3})/i
    );

    // Consumer care officer / cell name
    const careOfficerMatch = cleanText.match(/(?:Manager\s*Customer\s*Care|Customer\s*Care\s*Executive|Customer\s*Care\s*Officer|Consumer\s*Care\s*Cell|Grievance\s*Officer)/i);
    const careOfficerVal = careOfficerMatch ? careOfficerMatch[0] : (parsedCare.phone.value || parsedCare.email.value ? "Manager Customer Care" : null);

    const createField = (
      fieldName: string,
      label: string,
      value: string | null,
      legalRef: string,
      desc: string,
      confidence: number = 90
    ): ExtractedFieldItem => {
      const status: FieldStatus =
        value && value.trim().length > 0 && confidence >= 90
          ? "DETECTED"
          : value && value.trim().length > 0
          ? "UNCERTAIN"
          : "MISSING";

      return {
        fieldName,
        label,
        value,
        status,
        confidence: value ? confidence : 0,
        isUserCorrected: false,
        sourceTextSnippet: value ? `Snippet: "${value}"` : undefined,
        extractionMethod: "CONTEXTUAL_PARSER",
        legalReference: legalRef,
        description: desc,
      };
    };

    // Ingredients field is NOT_APPLICABLE for Footwear / Apparel / Electronics
    let ingredientsItem: ExtractedFieldItem;
    if (category === "FOOTWEAR" || category === "APPAREL" || category === "ELECTRONICS") {
      ingredientsItem = {
        fieldName: "ingredients",
        label: "Ingredients / Formulation",
        value: null,
        status: "NOT_APPLICABLE",
        confidence: 100,
        isUserCorrected: false,
        extractionMethod: "CONTEXTUAL_PARSER",
        reasonForSelection: `Ingredients declaration is exempt and not applicable for ${category} commodities.`,
        legalReference: "Exempt for Non-Food/Non-Cosmetic Commodities",
        description: "List of ingredients or chemical formulation",
      };
    } else {
      ingredientsItem = createField(
        "ingredients",
        "Ingredients / Composition",
        ingredientsMatch ? ingredientsMatch[1].trim() : null,
        "Statutory Food / Cosmetic Standards",
        "List of ingredients or chemical formulation",
        ingredientsMatch ? 92 : 0
      );
    }

    return {
      productCategory: category,
      productName: parsedNames.productName,
      genericName: parsedNames.genericName,
      brandName: footwearFields.brandName,
      articleCode: footwearFields.articleCode,
      style: footwearFields.style,
      colour: footwearFields.colour,
      dimensionOrSize: footwearFields.dimensionOrSize,
      productDescription: createField(
        "productDescription",
        "Product Description & Key Features",
        descMatch ? descMatch[1].trim() : null,
        "General Declaration",
        "Description of commodity features, usage, or specifications",
        descMatch ? 88 : 0
      ),
      ingredients: ingredientsItem,
      batchNumber: parsedBatch,
      fssaiNumber: parsedLic,
      manufacturerName: parsedMfr.manufacturerName,
      manufacturerAddress: parsedMfr.manufacturerAddress,
      countryOfOrigin: createField(
        "countryOfOrigin",
        "Country of Origin",
        originVal,
        "Rule 6(1)(a) & Rule 27",
        "Nation of manufacture or assembly",
        originVal ? 98 : 0
      ),
      netQuantity: parsedQty.netQuantity,
      netQuantityUnit: parsedQty.netQuantityUnit,
      netQuantityValue: parsedQty.netQuantityValue,
      mrp: parsedMrp,
      mrpInclusiveTaxes: createField(
        "mrpInclusiveTaxes",
        "MRP Tax Inclusivity Declaration",
        hasTaxInclusivity ? "Declared (inclusive of all taxes)" : null,
        "Rule 6(1)(e)",
        "Explicit statement 'inclusive of all taxes'",
        hasTaxInclusivity ? 98 : 0
      ),
      unitSalePrice: createField(
        "unitSalePrice",
        "Unit Sale Price (USP)",
        category === "FOOTWEAR" || category === "APPAREL" ? null : uspMatch ? uspMatch[1].trim() : null,
        "Rule 6(1)(g)",
        "Price per unit weight/measure",
        category === "FOOTWEAR" || category === "APPAREL" ? 0 : uspMatch ? 92 : 0
      ),
      manufacturingDate: parsedDates.mfgDate,
      packagingDate: parsedDates.mfgDate,
      expiryDate: parsedDates.expiryDate,
      consumerCareName: createField(
        "consumerCareName",
        "Consumer Care Officer / Cell",
        careOfficerVal,
        "Rule 6(1)(f)",
        "Contact person or department for customer grievances",
        careOfficerVal ? 95 : 0
      ),
      consumerCareAddress: parsedMfr.manufacturerAddress,
      consumerCarePhone: parsedCare.phone,
      consumerCareEmail: parsedCare.email,
      otherDeclarations: [],
    };
  }
}
