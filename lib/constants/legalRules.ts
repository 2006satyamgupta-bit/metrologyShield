import { ComplianceRuleDefinition } from "@/types";

export const STATUTORY_COMPLIANCE_RULES: ComplianceRuleDefinition[] = [
  {
    ruleId: "RULE_MFR_ADDRESS",
    ruleCode: "LMPC-R6-1A-MFR",
    name: "Manufacturer / Packer / Importer Name & Complete Postal Address",
    category: "MANUFACTURER",
    legalReference: "Rule 6(1)(a), Legal Metrology (Packaged Commodities) Rules, 2011",
    description:
      "Every package must declare the name and complete address of the manufacturer, or where the manufacturer is not the packer, the name and address of the manufacturer and packer, or the importer in case of imported packages. The address must include city, state, and postal PIN code.",
    requiredFields: ["manufacturerName", "manufacturerAddress"],
    severity: "CRITICAL",
    statutoryMaxPenalty: "₹25,000 for first offence, ₹50,000 for second offence, up to ₹1,00,000 / 1 year imprisonment for subsequent offences (Sec. 36 of Legal Metrology Act, 2009)",
  },
  {
    ruleId: "RULE_COUNTRY_OF_ORIGIN",
    ruleCode: "LMPC-R6-1A-COO",
    name: "Country of Origin Declaration",
    category: "IDENTITY",
    legalReference: "Rule 6(1)(a) & Rule 27, Legal Metrology (Packaged Commodities) Rules, 2011",
    description:
      "For imported goods and pre-packaged commodities, the country of origin or manufacture must be clearly stated on the package (e.g., 'Country of Origin: India', 'Made in India', 'Product of Germany').",
    requiredFields: ["countryOfOrigin"],
    severity: "HIGH",
    statutoryMaxPenalty: "₹25,000 for first offence (Sec. 36 Legal Metrology Act)",
  },
  {
    ruleId: "RULE_GENERIC_NAME",
    ruleCode: "LMPC-R6-1B-GEN",
    name: "Generic or Common Name of Commodity",
    category: "IDENTITY",
    legalReference: "Rule 6(1)(b), Legal Metrology (Packaged Commodities) Rules, 2011",
    description:
      "Every package must declare the common or generic name of the commodity contained in the package so that the consumer can identify the nature of the product without ambiguity.",
    requiredFields: ["productName", "genericName"],
    severity: "HIGH",
    statutoryMaxPenalty: "₹25,000 under Section 36",
  },
  {
    ruleId: "RULE_NET_QUANTITY_STANDARD_UNITS",
    ruleCode: "LMPC-R6-1C-QTY",
    name: "Net Quantity in Standard SI Metric Units",
    category: "QUANTITY",
    legalReference: "Rule 6(1)(c) & Rules 11, 12, 13, Legal Metrology (Packaged Commodities) Rules, 2011",
    description:
      "The net quantity in terms of standard unit of weight (g, kg), volume (ml, l/L), length (m, cm), area (sq m), or number (N, U, count, pieces) must be declared. Non-standard symbols such as 'gms', 'cc', 'pkts', 'kilos', 'k.g.' are strictly prohibited under Rule 13.",
    requiredFields: ["netQuantity", "netQuantityUnit", "netQuantityValue"],
    severity: "CRITICAL",
    statutoryMaxPenalty: "Fine up to ₹25,000 (First offence) / ₹50,000 (Second offence)",
  },
  {
    ruleId: "RULE_MANUFACTURING_PACKING_DATE",
    ruleCode: "LMPC-R6-1D-DATE",
    name: "Month and Year of Manufacture / Packaging / Import",
    category: "DATES",
    legalReference: "Rule 6(1)(d), Legal Metrology (Packaged Commodities) Rules, 2011",
    description:
      "Every package must declare the month and year in which the commodity is manufactured, pre-packed, or imported (e.g., 'Mfg Date: 04/2024', 'Pkd: April 2024', 'Imported: 01/2024').",
    requiredFields: ["manufacturingDate", "packagingDate"],
    severity: "HIGH",
    statutoryMaxPenalty: "Fine up to ₹25,000 under Section 36",
  },
  {
    ruleId: "RULE_MRP_INCLUSIVE_TAXES",
    ruleCode: "LMPC-R6-1E-MRP",
    name: "Maximum Retail Price (MRP) with Mandatory Tax Inclusivity Statement",
    category: "PRICING",
    legalReference: "Rule 6(1)(e) & Rule 2(m), Legal Metrology (Packaged Commodities) Rules, 2011",
    description:
      "The Maximum Retail Price (MRP) must be declared in Indian Rupees (₹ or Rs.) in the format 'MRP Rs. XX.XX (incl. of all taxes)' or 'Maximum Retail Price Rs. XX.XX (inclusive of all taxes)'. Declaring MRP without 'incl. of all taxes' or with extra taxes is a direct statutory violation.",
    requiredFields: ["mrp", "mrpInclusiveTaxes"],
    severity: "CRITICAL",
    statutoryMaxPenalty: "₹25,000 for first offence; ₹50,000 for second offence; ₹1,00,000 or jail for subsequent (Sec 36)",
  },
  {
    ruleId: "RULE_UNIT_SALE_PRICE",
    ruleCode: "LMPC-R6-1G-USP",
    name: "Unit Sale Price (USP) Declaration",
    category: "PRICING",
    legalReference: "Rule 6(1)(g), LMPC (Amendment) Rules, 2021/2022",
    description:
      "For packages containing quantities more than 1 kg / 1 L / 1 unit, the unit sale price rounded off to the nearest two decimal places must be declared (e.g., '₹ 0.40 per g', '₹ 25.00 per 100ml', '₹ 15.00 per piece').",
    requiredFields: ["unitSalePrice"],
    severity: "MEDIUM",
    statutoryMaxPenalty: "₹25,000 under Section 36",
  },
  {
    ruleId: "RULE_CONSUMER_CARE_DETAILS",
    ruleCode: "LMPC-R6-1F-CARE",
    name: "Consumer Care Contact Information",
    category: "CONSUMER_CARE",
    legalReference: "Rule 6(1)(f), Legal Metrology (Packaged Commodities) Rules, 2011",
    description:
      "Every package must declare the name, address, telephone number (helpline/toll-free), and email address of the person or grievance officer who can be contacted by the consumer in case of consumer complaints.",
    requiredFields: ["consumerCarePhone", "consumerCareEmail", "consumerCareAddress"],
    severity: "HIGH",
    statutoryMaxPenalty: "₹25,000 fine under Section 36",
  },
  {
    ruleId: "RULE_EXPIRY_BEST_BEFORE",
    ruleCode: "LMPC-R10-EXP",
    name: "Best Before / Expiry Date (Consumable & Perishable Goods)",
    category: "DATES",
    legalReference: "Rule 10, Legal Metrology (Packaged Commodities) Rules & Food Safety Standards",
    description:
      "For products liable to perish or deteriorate over time, the Best Before or Use By date (Month and Year or specific date) must be declared conspicuously on the package.",
    requiredFields: ["expiryDate", "bestBefore"],
    severity: "HIGH",
    statutoryMaxPenalty: "₹25,000 under LMPC and penalties under Food Safety / Consumer Protection Acts",
  },
  {
    ruleId: "RULE_DUAL_MRP_PROHIBITION",
    ruleCode: "LMPC-R18-DUAL",
    name: "Prohibition of Dual MRP & Price Overwriting",
    category: "PRICING",
    legalReference: "Rule 18(1) & 18(2), Legal Metrology (Packaged Commodities) Rules, 2011",
    description:
      "No manufacturer, packer, or seller shall declare different Maximum Retail Prices (dual MRP) on an identical pre-packaged commodity, nor smudge, alter, or paste stickers to inflate the printed MRP.",
    requiredFields: ["mrp"],
    severity: "CRITICAL",
    statutoryMaxPenalty: "₹25,000 to ₹1,00,000 and possible confiscation of packages",
  },
  {
    ruleId: "RULE_PDP_PROMINENCE",
    ruleCode: "LMPC-R7-PDP",
    name: "Principal Display Panel (PDP) Conspicuousness & Minimum Font Legibility",
    category: "DISPLAY",
    legalReference: "Rule 7 & Rule 8, Legal Metrology (Packaged Commodities) Rules, 2011",
    description:
      "All mandatory statutory declarations must be clear, conspicuous, distinct, with appropriate font height proportioned to the area of the principal display panel, and visually contrasting with the background.",
    requiredFields: [],
    severity: "MEDIUM",
    statutoryMaxPenalty: "₹25,000 under Section 36",
  },
];

export const STATUTORY_LEGAL_DISCLAIMER =
  "MetrologyShield is an automated regulatory intelligence and compliance assistance tool. While evaluations are based on the Legal Metrology Act, 2009 and Legal Metrology (Packaged Commodities) Rules, 2011 (as amended), reports generated do not constitute formal legal counsel. Users are advised to verify label art against the Gazette notifications and state-level enforcement directives before commercial distribution.";
