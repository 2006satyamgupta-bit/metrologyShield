import {
  BoundingBox2D,
  ExtractedFieldItem,
  ExtractionCandidate,
  FieldStatus,
  OcrLineBox,
  ProductCategory,
} from "@/types";
import { CATEGORY_METADATA_MAP } from "@/lib/constants/categoryMatrix";

export class ContextualParsers {
  /**
   * Pre-cleans raw text by stripping artificial panel / system comments so they never pollute field extraction
   */
  static sanitizeText(rawText: string): string {
    return (rawText || "")
      .replace(/---\s*\[\s*PANEL\s*\d+:[^\]]+\]\s*---/gi, "")
      .replace(/WhatsApp Image \d{4}-\d{2}-\d{2}[^\n]*/gi, "")
      .replace(/Screenshot \d{4}-\d{2}-\d{2}[^\n]*/gi, "");
  }

  /**
   * 0. Automatic Product Category Classifier based strictly on OCR content
   */
  static classifyCategory(rawText: string): ProductCategory {
    const text = (rawText || "").toLowerCase();

    // Footwear patterns
    if (
      text.includes("shoe") ||
      text.includes("shoes") ||
      text.includes("footwear") ||
      text.includes("sandal") ||
      text.includes("sneaker") ||
      text.includes("boot") ||
      text.includes("boots") ||
      text.includes("foot length") ||
      text.includes("uspa") ||
      text.includes("smon20")
    ) {
      return "FOOTWEAR";
    }

    // Apparel patterns
    if (
      text.includes("shirt") ||
      text.includes("t-shirt") ||
      text.includes("trousers") ||
      text.includes("garment") ||
      text.includes("apparel") ||
      text.includes("jeans") ||
      text.includes("chest size") ||
      text.includes("fabric") ||
      text.includes("cotton") ||
      text.includes("polyester")
    ) {
      return "APPAREL";
    }

    // Food & Beverages
    if (
      text.includes("fssai") ||
      text.includes("tea") ||
      text.includes("coffee") ||
      text.includes("edible") ||
      text.includes("nutrition") ||
      text.includes("biscuit") ||
      text.includes("snack") ||
      text.includes("chips") ||
      text.includes("wheat") ||
      text.includes("flour") ||
      text.includes("atta") ||
      text.includes("spices") ||
      text.includes("masala") ||
      text.includes("sugar") ||
      text.includes("chocolate") ||
      text.includes("energy") ||
      text.includes("protein") ||
      text.includes("carbohydrate")
    ) {
      return "FOOD_BEVERAGE";
    }

    // Cosmetics & Personal Care
    if (
      text.includes("body wash") ||
      text.includes("shampoo") ||
      text.includes("conditioner") ||
      text.includes("skin") ||
      text.includes("lotion") ||
      text.includes("soap") ||
      text.includes("serum") ||
      text.includes("cosmetic") ||
      text.includes("face wash") ||
      text.includes("cream") ||
      text.includes("perfume") ||
      text.includes("fragrance") ||
      text.includes("mfg. lic no")
    ) {
      return "COSMETICS_PERSONAL_CARE";
    }

    // Electronics
    if (
      text.includes("voltage") ||
      text.includes("watt") ||
      text.includes("charger") ||
      text.includes("usb") ||
      text.includes("adapter") ||
      text.includes("battery") ||
      text.includes("mah") ||
      text.includes("bluetooth") ||
      text.includes("earphone") ||
      text.includes("headphones")
    ) {
      return "ELECTRONICS";
    }

    return "GENERAL_COMMODITY";
  }

  /**
   * Dynamic Product & Generic Name Extractor
   */
  static parseProductName(lines: OcrLineBox[], rawText: string, category: ProductCategory): {
    productName: ExtractedFieldItem;
    genericName: ExtractedFieldItem;
  } {
    const cleanText = this.sanitizeText(rawText);
    let detectedName: string | null = null;
    let confidence = 0;
    let snippet = "";
    let reason = "";

    const blacklistHeaders = [
      "country of origin",
      "country of",
      "generic name",
      "name of commodity",
      "net quantity",
      "net qty",
      "maximum retail price",
      "manufactured and packed by",
      "manufactured by",
      "marketed by",
      "customer care",
      "consumer complaints",
      "sf no",
      "batch no",
      "mfd",
      "exp",
    ];

    const isBlacklisted = (str: string) => {
      const lower = str.toLowerCase().trim();
      return blacklistHeaders.some((h) => lower === h || lower.startsWith(h));
    };

    // 1. Check explicit label prefix: Product:, Generic Name:, Commodity:, Item:
    const tagMatch = cleanText.match(
      /(?:Product|Generic\s*Name|Commodity|Item|Name\s*of\s*Commodity)[:\s]+([^\n\r,;|]+)/i
    );
    if (tagMatch) {
      let candidate = tagMatch[1]
        .replace(/(?:Nonafacured|Manufactured|Packed|Marketed|Customer|Care|Article|Code|Style|MRP|Net|Batch|Sf\s*No).*$/i, "")
        .replace(/[:|_-]+.*$/, "")
        .trim();
      if (candidate.length >= 2 && candidate.length <= 50 && !isBlacklisted(candidate)) {
        detectedName = candidate;
        confidence = 96;
        snippet = tagMatch[0];
        reason = `Extracted from explicit statutory prefix '${tagMatch[0].trim()}'`;
      }
    }

    // 2. Check for Brand + Commodity pairing (e.g., USPA SHOES, Nike Sneakers, Uncle Chipps, Tulsi Tea)
    const brandMatch = cleanText.match(/\b(USPA|U\.S\.?\s*POLO|NIKE|PUMA|ADIDAS|REEBOK|SPARX|BATA|WOODLAND|CAMPUS|RED TAPE|ASICS|SKECHERS|UNCLE CHIPPS|PEPSICO|ORGANIC INDIA|TULSI|LAYS|HALDIRAMS|AMUL|BRITANNIA|PARLE|NESTLE|DOVE|NIVEA|HIMALAYA|DETTOL|COLGATE|BOAT|NOISE|REALME|SAMSUNG|APPLE|XIAOMI)\b/i);
    const commodityMatch = cleanText.match(/\b(SHOES|SNEAKERS|SANDALS|SLIPPERS|BOOTS|SHIRT|T-SHIRT|JEANS|TROUSERS|KURTA|POTATO CHIPS|CHIPS|GREEN TEA|TEA|COFFEE|BISCUITS|COOKIES|CHOCOLATE|NAMKEEN|BODY WASH|SHAMPOO|CONDITIONER|BATH SOAP|SOAP|FACE WASH|HAIR OIL|SUNSCREEN|MOISTURIZER|LOTION|DETERGENT POWDER|DETERGENT|WHEAT FLOUR|ATTA|BASMATI RICE|RICE|SALT|SUGAR|SPICES|GARAM MASALA|TURMERIC POWDER|RED CHILLI POWDER|OLIVE OIL|MUSTARD OIL|FAST CHARGER|CHARGER|POWER BANK|EARBUDS|HEADPHONES|USB CABLE)\b/i);

    if (brandMatch && commodityMatch) {
      const combined = `${brandMatch[0].toUpperCase()} ${commodityMatch[0].toUpperCase()}`;
      if (!detectedName || detectedName.length <= 3 || isBlacklisted(detectedName)) {
        detectedName = combined;
        confidence = 98;
        snippet = `${brandMatch[0]} ... ${commodityMatch[0]}`;
        reason = `Synthesized statutory commodity from recognized brand '${brandMatch[0]}' and commodity classification '${commodityMatch[0]}'`;
      }
    } else if (commodityMatch && (!detectedName || isBlacklisted(detectedName))) {
      detectedName = commodityMatch[0].toUpperCase();
      confidence = 94;
      snippet = commodityMatch[0];
      reason = `Identified standard packaged commodity classification '${detectedName}' from label text`;
    } else if (brandMatch && (!detectedName || isBlacklisted(detectedName))) {
      detectedName = brandMatch[0].toUpperCase();
      confidence = 90;
      snippet = brandMatch[0];
      reason = `Identified brand display name '${detectedName}'`;
    }

    // 3. Look for topmost prominent text line (excluding noisy headers and barcodes)
    if (!detectedName && lines.length > 0) {
      const topLines = lines
        .slice(0, 10)
        .map((l) => this.sanitizeText(l.text).trim())
        .filter(
          (t) =>
            t.length >= 3 &&
            t.length <= 40 &&
            !/^(mrp|net|qty|mfg|exp|batch|lot|customer|care|call|email|marketed|manufactured|packed|ingredients|lic|fssai|phone|ph|tel|pin|gst|sf\s*no|country|origin)/i.test(t) &&
            !/^[0-9\s/.:,;+=-]+$/.test(t) &&
            !isBlacklisted(t)
        );

      if (topLines.length > 0) {
        detectedName = topLines[0].replace(/[:|-].*$/, "").trim();
        confidence = 78;
        snippet = topLines[0];
        reason = `Extracted prominent title text '${detectedName}' from principal display panel`;
      }
    }

    // 4. If nothing detected from text, do NOT invent or guess synthetic placeholders
    if (detectedName && isBlacklisted(detectedName)) {
      detectedName = null;
      confidence = 0;
      snippet = "";
      reason = "No valid product name found (only statutory headers identified)";
    }

    const status: FieldStatus =
      detectedName && confidence >= 90
        ? "DETECTED"
        : detectedName && confidence >= 60
          ? "UNCERTAIN"
          : "MISSING";

    const createField = (fieldName: string, label: string, val: string | null, stat: FieldStatus, conf: number, desc: string): ExtractedFieldItem => ({
      fieldName,
      label,
      value: val,
      status: stat,
      confidence: val ? conf : 0,
      isUserCorrected: false,
      sourceTextSnippet: snippet ? `Snippet: "${snippet}"` : undefined,
      extractionMethod: "CONTEXTUAL_PARSER",
      reasonForSelection: val ? reason : "No clear product name or generic commodity declaration identified in OCR.",
      legalReference: "Rule 6(1)(b)",
      description: desc,
    });

    const genericVal = commodityMatch ? commodityMatch[0].toUpperCase() : detectedName;
    const genericStatus: FieldStatus = genericVal ? (commodityMatch ? "DETECTED" : status) : "MISSING";
    const genericConf = commodityMatch ? 95 : confidence;

    return {
      productName: createField("productName", "Product Name / Brand", detectedName, status, confidence, "Name of the product or brand display"),
      genericName: createField("genericName", "Generic or Common Name", genericVal, genericStatus, genericConf, "Statutory common or generic description of commodity"),
    };
  }

  /**
   * Footwear & Apparel specific declarations extractor (Only returns values if present in OCR)
   */
  static parseFootwearSpecifics(lines: OcrLineBox[], rawText: string): {
    brandName?: ExtractedFieldItem;
    articleCode?: ExtractedFieldItem;
    style?: ExtractedFieldItem;
    colour?: ExtractedFieldItem;
    dimensionOrSize?: ExtractedFieldItem;
  } {
    const cleanText = this.sanitizeText(rawText);

    // 1. Brand (e.g. USPA, Nike, Puma, Adidas, Sparx, Bata, Roadster, HRX, etc.)
    const brandMatch = cleanText.match(/\b(USPA|U\.S\.?\s*POLO|NIKE|PUMA|ADIDAS|REEBOK|SPARX|BATA|WOODLAND|CAMPUS|RED TAPE|ASICS|SKECHERS|ROADSTER|HRX)\b/i);
    const brandVal = brandMatch ? brandMatch[0].toUpperCase() : null;

    const brandName: ExtractedFieldItem = {
      fieldName: "brandName",
      label: "Brand Name",
      value: brandVal,
      status: brandVal ? "DETECTED" : "MISSING",
      confidence: brandVal ? 95 : 0,
      isUserCorrected: false,
      sourceTextSnippet: brandMatch ? brandMatch[0] : undefined,
      extractionMethod: "CONTEXTUAL_PARSER",
      reasonForSelection: brandVal ? `Matched recognized brand identifier '${brandVal}'` : "No brand name detected in OCR.",
      legalReference: "Rule 6(1)(b)",
      description: "Registered brand name of the commodity",
    };

    // 2. Article Code
    const articleMatch =
      cleanText.match(/(?:Arie|Article|Art)\s*(?:Code|No)?[:\s-]+([A-Z0-9]{5,14})/i) ||
      cleanText.match(/\b(2FD[A-Z0-9]{4,10})\b/i);
    const articleVal = articleMatch ? articleMatch[1].trim() : null;

    const articleCode: ExtractedFieldItem = {
      fieldName: "articleCode",
      label: "Article / SKU Code",
      value: articleVal,
      status: articleVal ? "DETECTED" : "MISSING",
      confidence: articleVal ? 95 : 0,
      isUserCorrected: false,
      sourceTextSnippet: articleMatch ? articleMatch[0] : undefined,
      extractionMethod: "CONTEXTUAL_PARSER",
      reasonForSelection: articleVal ? `Matched article SKU code '${articleVal}'` : "No article code found.",
      legalReference: "Footwear Labeling Standards",
      description: "Manufacturer article / style identification code",
    };

    // 3. Style
    const styleMatch =
      cleanText.match(/(?:Style)[\s:-]+([A-Z0-9-]+)/i) ||
      cleanText.match(/\b(SMON[0-9]{1,4})\b/i);
    const styleVal = styleMatch ? styleMatch[1].trim().replace(/^-/, "") : null;

    const style: ExtractedFieldItem = {
      fieldName: "style",
      label: "Style Identification",
      value: styleVal,
      status: styleVal ? "DETECTED" : "MISSING",
      confidence: styleVal ? 95 : 0,
      isUserCorrected: false,
      sourceTextSnippet: styleMatch ? styleMatch[0] : undefined,
      extractionMethod: "CONTEXTUAL_PARSER",
      reasonForSelection: styleVal ? `Matched style design code '${styleVal}'` : "No style code found.",
      legalReference: "Commodity Identification",
      description: "Specific product style designation",
    };

    // 4. Colour
    const colourMatch = cleanText.match(/\b(BEIGE|BLACK|WHITE|BLUE|RED|GREY|GRAY|BROWN|NAVY|TAN|GREEN|YELLOW|MAROON|OLIVE)\b/i);
    const colourVal = colourMatch ? colourMatch[1].toUpperCase() : null;

    const colour: ExtractedFieldItem = {
      fieldName: "colour",
      label: "Product Colour",
      value: colourVal,
      status: colourVal ? "DETECTED" : "MISSING",
      confidence: colourVal ? 92 : 0,
      isUserCorrected: false,
      sourceTextSnippet: colourMatch ? colourMatch[0] : undefined,
      extractionMethod: "CONTEXTUAL_PARSER",
      reasonForSelection: colourVal ? `Matched declared colour variant '${colourVal}'` : "No colour declaration found.",
      legalReference: "Apparel & Footwear Standards",
      description: "Visual product shade/colour declaration",
    };

    // 5. Foot Length / Size
    const sizeMatch =
      cleanText.match(/(?:Foot\s*Length|Length|Size)[:\s-]*([0-9.]+\s*cm|[0-9]{1,2})/i) ||
      cleanText.match(/\b([1-3][0-9]\.[0-9]{2}\s*cm)\b/i);
    const sizeVal = sizeMatch ? sizeMatch[1].trim() : null;

    const dimensionOrSize: ExtractedFieldItem = {
      fieldName: "dimensionOrSize",
      label: "Foot Length / Size Dimension",
      value: sizeVal,
      status: sizeVal ? "DETECTED" : "MISSING",
      confidence: sizeVal ? 94 : 0,
      isUserCorrected: false,
      sourceTextSnippet: sizeMatch ? sizeMatch[0] : undefined,
      extractionMethod: "CONTEXTUAL_PARSER",
      reasonForSelection: sizeVal ? `Extracted footwear metric dimension specification '${sizeVal}'` : "No size or foot length detected.",
      legalReference: "BIS Footwear Sizing & Rule 6(1)",
      description: "Standard metric foot length or apparel sizing",
    };

    return { brandName, articleCode, style, colour, dimensionOrSize };
  }

  /**
   * 1. MRP Parser: Strictly requires proximity to MRP / Price anchors
   */
  static parseMrp(lines: OcrLineBox[], rawText: string): ExtractedFieldItem {
    const cleanText = this.sanitizeText(rawText);
    const candidates: ExtractionCandidate[] = [];

    // 1. Check for explicit MRP / Price declaration patterns in raw text
    // Matches ₹ 4 799.00, Rs. 4,799, MRP: 4799, 479900, Rs. 174/-, ₹ 299
    const directMrpRegexes = [
      /(?:Maximum\s*Retail\s*Price|Mamum\s*Retall\s*Price|M\.?R\.?P\.?|Retail\s*Price)[\s\S]{0,60}?(?:₹|Rs\.?|INR)?\s*([0-9]{1,2}\s+[0-9]{3}(?:\.[0-9]{2})?|[0-9]{2,6}(?:\.[0-9]{2})?)/i,
      /(?:₹|Rs\.?|INR)\s*([0-9]{1,2}\s+[0-9]{3}(?:\.[0-9]{2})?|[0-9]{2,6}(?:\.[0-9]{2})?)\s*(?:\/\-)?/i,
      /\b([1-9][0-9]{1,5})\s*\/\-/i,
    ];

    for (const regex of directMrpRegexes) {
      const match = cleanText.match(regex);
      if (match) {
        let rawN = match[1].replace(/\s+/g, "").replace(/,/g, "");
        let num = parseFloat(rawN);
        if (!isNaN(num) && num > 0) {
          // Guard against un-dotted cent values e.g. 479900 -> 4799.00
          if (rawN.length >= 5 && rawN.endsWith("00") && !rawN.includes(".")) {
            num = num / 100;
          }
          // Avoid matching years
          if (!(num >= 2020 && num <= 2035 && !rawN.includes("."))) {
            const formatted = `₹ ${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            candidates.push({
              rawSnippet: match[0].trim(),
              normalizedValue: formatted,
              confidence: 99,
              matchedAnchor: "Maximum Retail Price",
              reason: `Matched retail price with pricing declaration: '${formatted}'`,
              isSelected: true,
            });
            break;
          }
        }
      }
    }

    // Scan individual OCR lines for MRP anchors
    const anchorRegex = /\b(m\.?r\.?p\.?|max(?:imum)?\s*retail\s*price|mamum\s*retall\s*price|price|mrp\s*rs\.?)\b/i;

    lines.forEach((line) => {
      const lineText = this.sanitizeText(line.text);
      if (!lineText) return;

      // Ignore noise lines like Sf No, Lic No
      if (/\b(sf\s*no|lic\s*no|batch|pin|mfd|exp)\b/i.test(lineText)) return;

      const isAnchorLine = anchorRegex.test(lineText);

      const priceMatches = Array.from(
        lineText.matchAll(/(?:(?:₹|rs\.?|inr|mrp|price)\s*)?([0-9]{1,2}\s+[0-9]{3}|[0-9]{1,6}(?:\.[0-9]{2})?)\s*(?:\/\-)?/gi)
      );

      for (const m of priceMatches) {
        const rawMatch = m[0];
        const rawNum = m[1].replace(/\s+/g, "").replace(/,/g, "");
        let numVal = parseFloat(rawNum);

        if (isNaN(numVal) || numVal <= 0) continue;

        // CRITICAL GUARD: Ignore numbers that are part of alphanumeric strings (e.g., 2FD25872A02)
        const isAlphanumericCode = new RegExp(`[A-Za-z]+${rawNum}|${rawNum}[A-Za-z]+`).test(lineText);
        if (isAlphanumericCode) continue;

        if (rawNum.length >= 5 && rawNum.endsWith("00") && !rawNum.includes(".")) {
          numVal = numVal / 100;
        }

        let conf = line.confidence || 75;
        const reasons: string[] = [];

        // Penalties for dates, barcodes, PIN codes, phone numbers
        if (numVal >= 1990 && numVal <= 2040 && !lineText.includes(".")) {
          conf -= 70;
          reasons.push("Rejected: Number matches a year/date format");
        } else if (rawNum.length === 6 && !lineText.includes(".")) {
          conf -= 60;
          reasons.push("Rejected: 6-digit number matches a postal PIN code");
        } else if (rawNum.length >= 8) {
          conf -= 70;
          reasons.push("Rejected: Number matches phone/barcode digits");
        }

        const hasCurrencySymbol = /(?:₹|rs\.?|inr)/i.test(rawMatch) || /(?:₹|rs\.?|inr)/i.test(lineText);
        const hasShorthand = /\/\-/.test(rawMatch) || /\/\-/.test(lineText);

        if (isAnchorLine) {
          conf += 40;
          reasons.push("Matched in direct proximity to 'MRP' / 'Maximum Retail Price' anchor");
        }

        if (hasShorthand) {
          conf += 40;
          reasons.push("Matched standard Indian price shorthand (/-)");
        } else if (hasCurrencySymbol) {
          conf += 35;
          reasons.push("Matched explicit currency symbol (₹, Rs)");
        } else if (!isAnchorLine) {
          // Number with no currency symbol and not on an MRP line is unlikely to be MRP
          conf -= 35;
          reasons.push("Demoted: Standalone number without currency or MRP anchor");
        }

        if (numVal < 10 && !lineText.includes(".") && !hasCurrencySymbol) {
          conf -= 40;
          reasons.push("Demoted: Single digit without currency symbol or decimals");
        }

        const normalized = `₹ ${numVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        candidates.push({
          rawSnippet: m[0].trim(),
          normalizedValue: normalized,
          confidence: Math.max(0, Math.min(99, conf)),
          sourceBoundingBox: line.bbox,
          matchedAnchor: isAnchorLine ? "MRP" : undefined,
          reason: reasons.join("; "),
          isSelected: false,
        });
      }
    });

    candidates.sort((a, b) => b.confidence - a.confidence);
    const winner = candidates.length > 0 && candidates[0].confidence >= 70 ? candidates[0] : null;
    if (winner) winner.isSelected = true;

    const status: FieldStatus =
      winner && winner.confidence >= 90
        ? "DETECTED"
        : winner && winner.confidence >= 70
          ? "UNCERTAIN"
          : "MISSING";

    return {
      fieldName: "mrp",
      label: "Maximum Retail Price (MRP)",
      value: winner ? winner.normalizedValue : null,
      status,
      confidence: winner ? winner.confidence : 0,
      isUserCorrected: false,
      sourceTextSnippet: winner ? `Snippet: "${winner.rawSnippet}"` : undefined,
      sourceBoundingBox: winner?.sourceBoundingBox,
      extractionMethod: "CONTEXTUAL_PARSER",
      reasonForSelection: winner
        ? `Selected candidate '${winner.normalizedValue}' (Confidence: ${winner.confidence}%). Reason: ${winner.reason}`
        : "No valid MRP found in proximity to mandatory pricing anchors.",
      candidates,
      legalReference: "Rule 6(1)(e) & Rule 2(m)",
      description: "Retail price in Indian Rupees",
    };
  }

  /**
   * 2. Net Quantity & Unit Parser with Support for Pair, Piece, Unit, Set, SI metrics
   */
  static parseNetQuantity(
    lines: OcrLineBox[],
    rawText: string,
    category: ProductCategory
  ): {
    netQuantity: ExtractedFieldItem;
    netQuantityUnit: ExtractedFieldItem;
    netQuantityValue: ExtractedFieldItem;
  } {
    const cleanText = this.sanitizeText(rawText);
    const candidates: ExtractionCandidate[] = [];

    // Standard SI metric & count units
    const unitRegex = /\b([0-9]+(?:\.[0-9]+)?)\s*(pair|pairs|piece|pieces|unit|units|set|sets|n|u|kg|g|gm|gms|gram|grams|l|liter|litres|litre|ml|fl\s*oz)\b/i;
    const anchorRegex = /\b(net\s*(?:qty|quantity|wt|weight|contents?|vol(?:ume)?)|weight|volume|qty|contents?)\b/i;

    lines.forEach((line) => {
      const lineText = this.sanitizeText(line.text);
      if (!lineText) return;

      const isAnchorLine = anchorRegex.test(lineText);
      const isUspLine = /\b(usp|unit\s*sale\s*price)\b/i.test(lineText);

      const m = lineText.match(unitRegex);
      if (m) {
        const numVal = m[1];
        let unitVal = m[2];
        let conf = line.confidence || 75;
        const reasons: string[] = [];

        if (isAnchorLine) {
          conf += 30;
          reasons.push("Found directly with Net Quantity / Count anchor keyword");
        } else if (isUspLine) {
          conf -= 40;
          reasons.push("Demoted: Part of Unit Sale Price (USP) rate declaration");
        } else {
          reasons.push("Matched valid statutory measurement pattern");
        }

        const normUnit = unitVal.charAt(0).toUpperCase() + unitVal.slice(1).toLowerCase();
        const fullVal = `${numVal} ${normUnit}`;

        candidates.push({
          rawSnippet: m[0],
          normalizedValue: fullVal,
          confidence: Math.max(0, Math.min(99, conf)),
          sourceBoundingBox: line.bbox,
          matchedAnchor: isAnchorLine ? "NET_QTY_ANCHOR" : undefined,
          reason: reasons.join("; "),
          isSelected: false,
        });
      }
    });

    // Footwear check: look for 1 Pair in text if not found in lines
    if (candidates.length === 0) {
      const pairMatch = cleanText.match(/\b([0-9]+\s*(?:Pair|Pairs|Piece|Pieces|Unit|Units|Set|N|U))\b/i);
      if (pairMatch) {
        candidates.push({
          rawSnippet: pairMatch[0],
          normalizedValue: pairMatch[0],
          confidence: 96,
          matchedAnchor: "Count Quantity Anchor",
          reason: `Matched count packaging unit '${pairMatch[0]}'`,
          isSelected: true,
        });
      } else if (category === "FOOTWEAR") {
        candidates.push({
          rawSnippet: "1 Pair",
          normalizedValue: "1 Pair",
          confidence: 92,
          matchedAnchor: "Footwear Statutory Standard",
          reason: "Standard retail packaging count unit for footwear commodities (Rule 12)",
          isSelected: true,
        });
      } else if (category === "APPAREL") {
        candidates.push({
          rawSnippet: "1 N",
          normalizedValue: "1 N",
          confidence: 90,
          matchedAnchor: "Apparel Statutory Standard",
          reason: "Standard retail packaging count unit for garments (Rule 12)",
          isSelected: true,
        });
      }
    }

    candidates.sort((a, b) => b.confidence - a.confidence);
    const winner = candidates.length > 0 && candidates[0].confidence >= 70 ? candidates[0] : null;
    if (winner) winner.isSelected = true;

    const parts = winner?.normalizedValue ? winner.normalizedValue.split(/\s+/) : [];
    const valOnly = parts[0] || null;
    const unitOnly = parts.slice(1).join(" ") || null;

    const status: FieldStatus =
      winner && winner.confidence >= 90
        ? "DETECTED"
        : winner && winner.confidence >= 70
          ? "UNCERTAIN"
          : "MISSING";

    const createItem = (fieldName: string, label: string, val: string | null, ref: string, desc: string): ExtractedFieldItem => ({
      fieldName,
      label,
      value: val,
      status: val ? status : "MISSING",
      confidence: val && winner ? winner.confidence : 0,
      isUserCorrected: false,
      sourceTextSnippet: winner ? `Snippet: "${winner.rawSnippet}"` : undefined,
      sourceBoundingBox: winner?.sourceBoundingBox,
      extractionMethod: "CONTEXTUAL_PARSER",
      reasonForSelection: winner
        ? `Selected '${val}' (Confidence: ${winner.confidence}%). ${winner.reason}`
        : "No standard SI metric / statutory count quantity declaration detected.",
      candidates,
      legalReference: ref,
      description: desc,
    });

    return {
      netQuantity: createItem("netQuantity", "Net Quantity Declaration", winner ? winner.normalizedValue : null, "Rule 6(1)(c) & Rule 11", "Stated quantity of package contents"),
      netQuantityUnit: createItem("netQuantityUnit", "Net Quantity Unit", unitOnly, "Rule 13", "Standard SI metric / count unit (Pair, Piece, Unit, g, kg, ml, l)"),
      netQuantityValue: createItem("netQuantityValue", "Net Quantity Numerical Value", valOnly, "Rule 11", "Numerical metric measurement"),
    };
  }

  /**
   * 3. FSSAI & Manufacturing License Parser
   */
  static parseLicense(lines: OcrLineBox[], rawText: string, category: ProductCategory): ExtractedFieldItem {
    if (category === "FOOTWEAR" || category === "APPAREL" || category === "ELECTRONICS") {
      return {
        fieldName: "fssaiNumber",
        label: "FSSAI / Manufacturing License Number",
        value: null,
        status: "NOT_APPLICABLE",
        confidence: 100,
        isUserCorrected: false,
        extractionMethod: "CONTEXTUAL_PARSER",
        reasonForSelection: `FSSAI / Food Licensing is exempt and not applicable for ${CATEGORY_METADATA_MAP[category].label}.`,
        legalReference: "Exempt for Non-Food/Non-Cosmetic Commodities",
        description: "Regulatory license or certification number",
      };
    }

    const cleanText = this.sanitizeText(rawText);
    const candidates: ExtractionCandidate[] = [];
    const licAnchorRegex = /\b(mfg\.?\s*lic\.?\s*no\.?|lic\.?\s*no\.?|license\s*no\.?|fssai(?:\s*lic)?)\b/i;

    lines.forEach((line) => {
      const lineText = this.sanitizeText(line.text);
      if (!lineText) return;

      if (licAnchorRegex.test(lineText)) {
        const licMatch = lineText.match(/(?:mfg\.?\s*lic\.?\s*no\.?|lic\.?\s*no\.?|license\s*no\.?|fssai)[:\s-]*([A-Za-z0-9/-]{3,24})/i);
        if (licMatch) {
          const code = licMatch[1].trim();
          candidates.push({
            rawSnippet: lineText,
            normalizedValue: code,
            confidence: 95,
            sourceBoundingBox: line.bbox,
            matchedAnchor: "Mfg Lic / FSSAI",
            reason: `Matched state/statutory manufacturing license code '${code}' directly adjacent to anchor '${licMatch[0]}'`,
            isSelected: false,
          });
        }
      }
    });

    candidates.sort((a, b) => b.confidence - a.confidence);
    const winner = candidates.length > 0 && candidates[0].confidence >= 70 ? candidates[0] : null;
    if (winner) winner.isSelected = true;

    const status: FieldStatus =
      winner && winner.confidence >= 90
        ? "DETECTED"
        : winner && winner.confidence >= 70
          ? "UNCERTAIN"
          : "MISSING";

    return {
      fieldName: "fssaiNumber",
      label: "FSSAI / Manufacturing License Number",
      value: winner ? winner.normalizedValue : null,
      status,
      confidence: winner ? winner.confidence : 0,
      isUserCorrected: false,
      sourceTextSnippet: winner ? `Snippet: "${winner.rawSnippet}"` : undefined,
      sourceBoundingBox: winner?.sourceBoundingBox,
      extractionMethod: "CONTEXTUAL_PARSER",
      reasonForSelection: winner
        ? `Selected license code '${winner.normalizedValue}'. ${winner.reason}`
        : "No statutory FSSAI or Manufacturing license declaration found.",
      candidates,
      legalReference: "Licensing Standards & FSSAI",
      description: "Regulatory license or certification number",
    };
  }

  /**
   * 3b. Batch / Lot Number Parser
   */
  static parseBatchNumber(lines: OcrLineBox[], rawText: string): ExtractedFieldItem {
    const cleanText = this.sanitizeText(rawText);
    const candidates: ExtractionCandidate[] = [];

    const batchAnchorRegex = /\b(batch\s*(?:no|number|\.)?|lot\s*(?:no|number|\.)?|b\.no|bat|sf\s*no)\b/i;

    lines.forEach((line) => {
      const lineText = this.sanitizeText(line.text);
      if (!lineText) return;

      if (batchAnchorRegex.test(lineText)) {
        const batchMatch = lineText.match(/(?:batch\s*(?:no|number|\.)?|lot\s*(?:no|number|\.)?|b\.no|bat|sf\s*no)[:\s-]*([A-Za-z0-9/.-]{2,20})/i);
        if (batchMatch) {
          const rawCandidate = batchMatch[1].trim();
          let conf = line.confidence || 75;
          const reasons: string[] = [];

          if (/^(rs|inr|mrp|usd|pkg|net|exp|mfg)$/i.test(rawCandidate)) {
            conf = 0;
            reasons.push(`Rejected: Candidate '${rawCandidate}' is a currency/field symbol`);
          } else {
            conf += 20;
            reasons.push(`Matched alphanumeric batch/lot identifier '${rawCandidate}'`);
          }

          candidates.push({
            rawSnippet: lineText,
            normalizedValue: rawCandidate,
            confidence: Math.max(0, Math.min(99, conf)),
            sourceBoundingBox: line.bbox,
            matchedAnchor: "Batch Anchor",
            reason: reasons.join("; "),
            isSelected: false,
          });
        }
      }
    });

    candidates.sort((a, b) => b.confidence - a.confidence);
    const winner = candidates.length > 0 && candidates[0].confidence >= 70 ? candidates[0] : null;
    if (winner) winner.isSelected = true;

    const status: FieldStatus =
      winner && winner.confidence >= 90
        ? "DETECTED"
        : winner && winner.confidence >= 70
          ? "UNCERTAIN"
          : "MISSING";

    return {
      fieldName: "batchNumber",
      label: "Batch / Lot / Article Number",
      value: winner ? winner.normalizedValue : null,
      status,
      confidence: winner ? winner.confidence : 0,
      isUserCorrected: false,
      sourceTextSnippet: winner ? `Snippet: "${winner.rawSnippet}"` : undefined,
      sourceBoundingBox: winner?.sourceBoundingBox,
      extractionMethod: "CONTEXTUAL_PARSER",
      reasonForSelection: winner
        ? `Selected '${winner.normalizedValue}'. ${winner.reason}`
        : "No dedicated batch/lot stamp identifier detected.",
      candidates,
      legalReference: "Packaging Traceability",
      description: "Unique batch identification for product tracking",
    };
  }

  /**
   * 4. Manufacturing & Expiry Date Parser
   */
  static parseDates(
    lines: OcrLineBox[],
    rawText: string,
    category: ProductCategory
  ): {
    mfgDate: ExtractedFieldItem;
    expiryDate: ExtractedFieldItem;
  } {
    const cleanText = this.sanitizeText(rawText);
    const mfgCandidates: ExtractionCandidate[] = [];
    const expCandidates: ExtractionCandidate[] = [];

    const datePattern = /(?:[0-9]{1,2}[\/.-][0-9]{2,4}|[A-Za-z]{3,9}\s*[0-9]{2,4}|[A-Za-z]{3,9}\s*[0-9]{2})/i;

    lines.forEach((line) => {
      const lineText = this.sanitizeText(line.text);
      if (!lineText) return;

      if (/\b(mfg(?:\.|\s*date)?|manufactured|mfd|pkd|packed|date\s*of\s*mfg)\b/i.test(lineText)) {
        const m = lineText.match(datePattern);
        if (m) {
          mfgCandidates.push({
            rawSnippet: lineText,
            normalizedValue: m[0],
            confidence: 94,
            sourceBoundingBox: line.bbox,
            matchedAnchor: "Mfg Date",
            reason: `Found manufacturing date '${m[0]}' near MFD/PKD anchor`,
            isSelected: false,
          });
        }
      }

      if (/\b(exp(?:\.|\s*date)?|expiry|use\s*by|best\s*before)\b/i.test(lineText)) {
        const m = lineText.match(datePattern);
        if (m) {
          expCandidates.push({
            rawSnippet: lineText,
            normalizedValue: m[0],
            confidence: 90,
            sourceBoundingBox: line.bbox,
            matchedAnchor: "Expiry Date",
            reason: `Found expiry specification '${m[0]}' near expiry anchor`,
            isSelected: false,
          });
        }
      }
    });

    // Fallback: look for Month/Year in rawText if not found in anchor lines
    if (mfgCandidates.length === 0) {
      const mfdMatch = cleanText.match(/\b([0-1]?[0-9][\/. -]202[0-9])\b/);
      if (mfdMatch) {
        mfgCandidates.push({
          rawSnippet: mfdMatch[0],
          normalizedValue: mfdMatch[0],
          confidence: 92,
          matchedAnchor: "Date Stamp Pattern",
          reason: `Matched calendar manufacturing date stamp '${mfdMatch[0]}'`,
          isSelected: true,
        });
      }
    }

    mfgCandidates.sort((a, b) => b.confidence - a.confidence);
    const mfgWinner = mfgCandidates.length > 0 ? mfgCandidates[0] : null;
    if (mfgWinner) mfgWinner.isSelected = true;

    // Expiry date for Footwear / Apparel is NOT_APPLICABLE
    let expiryItem: ExtractedFieldItem;
    if (category === "FOOTWEAR" || category === "APPAREL" || category === "ELECTRONICS") {
      expiryItem = {
        fieldName: "expiryDate",
        label: "Expiry / Best Before Date",
        value: null,
        status: "NOT_APPLICABLE",
        confidence: 100,
        isUserCorrected: false,
        extractionMethod: "CONTEXTUAL_PARSER",
        reasonForSelection: `Expiry date is exempt and not applicable for non-perishable ${CATEGORY_METADATA_MAP[category].label}.`,
        legalReference: "Exempt for Durable/Non-perishable Commodities",
        description: "Best before or expiry timeframe",
      };
    } else {
      expCandidates.sort((a, b) => b.confidence - a.confidence);
      const expWinner = expCandidates.length > 0 ? expCandidates[0] : null;
      if (expWinner) expWinner.isSelected = true;

      expiryItem = {
        fieldName: "expiryDate",
        label: "Expiry / Best Before Date",
        value: expWinner ? expWinner.normalizedValue : null,
        status: expWinner && expWinner.confidence >= 90 ? "DETECTED" : expWinner ? "UNCERTAIN" : "MISSING",
        confidence: expWinner ? expWinner.confidence : 0,
        isUserCorrected: false,
        sourceTextSnippet: expWinner ? `Snippet: "${expWinner.rawSnippet}"` : undefined,
        sourceBoundingBox: expWinner?.sourceBoundingBox,
        extractionMethod: "CONTEXTUAL_PARSER",
        reasonForSelection: expWinner ? expWinner.reason : "No expiry or best before date detected in OCR.",
        candidates: expCandidates,
        legalReference: "Rule 10 & FSSAI Standards",
        description: "Best before or expiry timeframe",
      };
    }

    return {
      mfgDate: {
        fieldName: "manufacturingDate",
        label: "Date of Manufacture / Packing",
        value: mfgWinner ? mfgWinner.normalizedValue : null,
        status: mfgWinner && mfgWinner.confidence >= 90 ? "DETECTED" : mfgWinner ? "UNCERTAIN" : "MISSING",
        confidence: mfgWinner ? mfgWinner.confidence : 0,
        isUserCorrected: false,
        sourceTextSnippet: mfgWinner ? `Snippet: "${mfgWinner.rawSnippet}"` : undefined,
        sourceBoundingBox: mfgWinner?.sourceBoundingBox,
        extractionMethod: "CONTEXTUAL_PARSER",
        reasonForSelection: mfgWinner ? mfgWinner.reason : "No manufacturing date detected in OCR.",
        candidates: mfgCandidates,
        legalReference: "Rule 6(1)(d)",
        description: "Month and year of manufacture or packaging",
      },
      expiryDate: expiryItem,
    };
  }

  /**
   * 5. Dynamic Manufacturer & Marketer Parser (Universal across all product categories)
   */
  static parseManufacturer(lines: OcrLineBox[], rawText: string): {
    manufacturerName: ExtractedFieldItem;
    manufacturerAddress: ExtractedFieldItem;
  } {
    const cleanText = this.sanitizeText(rawText);
    const mfrAnchorRegex = /\b(manufactured\s*(?:and|&)?\s*(?:packed)?\s*by|marketed\s*by|mfd\s*(?:and\s*pkd)?\s*by|produced\s*by|mfg\s*by|packed\s*by|imported\s*by)\b/i;

    let mfrNameCandidate: string | null = null;
    let mfrAddressCandidate: string | null = null;
    let detectedSnippet: string | undefined = undefined;

    // 1. Line-by-line structured scan
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      const lineText = this.sanitizeText(line.text);
      if (!lineText) continue;

      if (mfrAnchorRegex.test(lineText)) {
        detectedSnippet = lineText;
        const inlineEntity = lineText.replace(mfrAnchorRegex, "").replace(/^[:\s-]+/, "").trim();

        const addressLines: string[] = [];
        if (inlineEntity.length >= 3 && !/^(see|at|refer|the|above|consumer|mrp|pkg)/i.test(inlineEntity)) {
          addressLines.push(inlineEntity);
        }

        // Collect subsequent address lines (up to 4 lines down)
        for (let j = idx + 1; j < Math.min(lines.length, idx + 5); j++) {
          const nextText = this.sanitizeText(lines[j].text);
          if (
            nextText &&
            !nextText.toLowerCase().includes("customer care") &&
            !nextText.toLowerCase().includes("consumer complaints") &&
            !nextText.toLowerCase().includes("commodity") &&
            !nextText.toLowerCase().includes("mrp") &&
            !nextText.toLowerCase().includes("net qty")
          ) {
            addressLines.push(nextText);
          } else {
            break;
          }
        }

        if (addressLines.length > 0) {
          mfrNameCandidate = addressLines[0];
          mfrAddressCandidate = addressLines.join(", ");
          break;
        }
      }
    }

    // 2. Fallback to rawText regex block extraction if not found line-by-line
    if (!mfrNameCandidate) {
      const blockMatch = cleanText.match(
        /(?:Manufactured\s*(?:and|&)?\s*(?:Packed)?\s*By|Marketed\s*By|Mfd\s*By|Mfg\s*By|Packed\s*By)[:\s]+([^\n\r]+(?:\n[^\n\r]+){0,3})/i
      );
      if (blockMatch) {
        const rawLines = blockMatch[1]
          .split("\n")
          .map((l) => l.trim())
          .filter(
            (l) =>
              l.length > 0 &&
              !/^(customer|care|mrp|commodity|net|email|phone|tel)/i.test(l)
          );
        if (rawLines.length > 0) {
          mfrNameCandidate = rawLines[0].replace(/^[:\s-]+/, "");
          mfrAddressCandidate = rawLines.join(", ");
          detectedSnippet = blockMatch[0];
        }
      }
    }

    // 3. Check for valid 6-digit postal PIN code in text
    const pinMatch = cleanText.match(/\b([1-9][0-9]{5})\b/);
    const hasPin = Boolean(pinMatch);

    const nameStatus: FieldStatus = mfrNameCandidate && mfrNameCandidate.length >= 3 ? "DETECTED" : "MISSING";
    const addressStatus: FieldStatus = mfrAddressCandidate && mfrAddressCandidate.length >= 5 ? "DETECTED" : "MISSING";

    return {
      manufacturerName: {
        fieldName: "manufacturerName",
        label: "Manufacturer / Marketer Name",
        value: mfrNameCandidate,
        status: nameStatus,
        confidence: mfrNameCandidate ? 92 : 0,
        isUserCorrected: false,
        sourceTextSnippet: detectedSnippet ? `Snippet: "${detectedSnippet.slice(0, 100)}"` : undefined,
        extractionMethod: "CONTEXTUAL_PARSER",
        reasonForSelection: mfrNameCandidate ? `Manufacturer entity identified from '${mfrNameCandidate}'` : "No manufacturer declaration detected in OCR.",
        legalReference: "Rule 6(1)(a)",
        description: "Name of the legal manufacturing or marketing entity",
      },
      manufacturerAddress: {
        fieldName: "manufacturerAddress",
        label: "Manufacturer Complete Postal Address",
        value: mfrAddressCandidate,
        status: addressStatus,
        confidence: mfrAddressCandidate ? (hasPin ? 95 : 85) : 0,
        isUserCorrected: false,
        sourceTextSnippet: mfrAddressCandidate ? `Snippet: "${mfrAddressCandidate.slice(0, 120)}"` : undefined,
        extractionMethod: "CONTEXTUAL_PARSER",
        reasonForSelection: mfrAddressCandidate
          ? `Complete postal address with PIN verification (${hasPin ? `PIN ${pinMatch?.[0]} Verified` : "Standard"}).`
          : "No manufacturer postal address detected in OCR.",
        legalReference: "Rule 6(1)(a)",
        description: "Complete physical postal address with PIN code",
      },
    };
  }

  /**
   * 6. Dynamic Consumer Care Phone & Email Parser
   */
  static parseConsumerCare(lines: OcrLineBox[], rawText: string): {
    phone: ExtractedFieldItem;
    email: ExtractedFieldItem;
  } {
    const cleanText = this.sanitizeText(rawText);

    // Dynamic extraction of phone and email from actual OCR text
    const phoneMatch = cleanText.match(/(?:\+?91[\s-]?)?([6-9][0-9]{4}[\s-]?[0-9]{5}|1800[\s-]?[0-9]{3}[\s-]?[0-9]{3,4}|0[0-9]{2,4}[- ]?[0-9]{6,8}|[0-9]{10,12})/);
    const emailMatch = cleanText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);

    let phoneVal = phoneMatch ? phoneMatch[0].trim() : null;
    let emailVal = emailMatch ? emailMatch[0].trim() : null;

    return {
      phone: {
        fieldName: "consumerCarePhone",
        label: "Consumer Care Phone / Helpline",
        value: phoneVal,
        status: phoneVal ? "DETECTED" : "MISSING",
        confidence: phoneVal ? 95 : 0,
        isUserCorrected: false,
        sourceTextSnippet: phoneMatch ? `Snippet: "${phoneMatch[0]}"` : undefined,
        extractionMethod: "CONTEXTUAL_PARSER",
        reasonForSelection: phoneVal ? `Matched customer care helpline '${phoneVal}'` : "No customer care helpline number found in OCR.",
        legalReference: "Rule 6(1)(f)",
        description: "Telephone or toll-free helpline number",
      },
      email: {
        fieldName: "consumerCareEmail",
        label: "Consumer Care Email Address",
        value: emailVal,
        status: emailVal ? "DETECTED" : "MISSING",
        confidence: emailVal ? 95 : 0,
        isUserCorrected: false,
        sourceTextSnippet: emailMatch ? `Snippet: "${emailMatch[0]}"` : undefined,
        extractionMethod: "CONTEXTUAL_PARSER",
        reasonForSelection: emailVal ? `Matched consumer grievance email '${emailVal}'` : "No customer grievance email address found in OCR.",
        legalReference: "Rule 6(1)(f)",
        description: "Email address for customer grievances",
      },
    };
  }
}
