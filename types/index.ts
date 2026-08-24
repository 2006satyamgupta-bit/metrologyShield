// =================================================================
// METROLOGYSHIELD — Central Type Definitions
// =================================================================

export type AnalysisStatus =
  | "UPLOADING"
  | "OCR_PROCESSING"
  | "EXTRACTING"
  | "REVIEW_READY"
  | "ANALYZING"
  | "COMPLETED"
  | "FAILED";

export type ComplianceStatus =
  | "COMPLIANT"
  | "PARTIALLY_COMPLIANT"
  | "NON_COMPLIANT"
  | "REQUIRES_REVIEW";

export type FieldStatus =
  | "DETECTED"
  | "MISSING"
  | "UNCERTAIN"
  | "NOT_APPLICABLE";

export type ViolationSeverity =
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "INFO";

export type RuleEvaluationStatus =
  | "PASS"
  | "VIOLATION"
  | "WARNING"
  | "NOT_APPLICABLE";

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  organization?: string;
  role?: "analyst" | "auditor" | "admin";
  createdAt: string;
}

export interface UploadedLabel {
  id: string;
  analysisId: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
  imageWidth?: number;
  imageHeight?: number;
  url: string;
  createdAt: string;
}

export interface OcrWordBox {
  text: string;
  confidence: number;
  bbox?: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface OcrLineBox {
  lineIndex: number;
  text: string;
  confidence: number;
  bbox?: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  words?: OcrWordBox[];
}

export interface OcrResult {
  id: string;
  analysisId: string;
  provider: "TESSERACT" | "GOOGLE_VISION" | "OPENAI_VISION" | "FALLBACK";
  rawText: string;
  confidence: number;
  wordCount: number;
  languageDetected: string;
  processingTimeMs: number;
  words?: OcrWordBox[];
  lines?: OcrLineBox[];
  createdAt: string;
}

export interface BoundingBox2D {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface ExtractionCandidate {
  rawSnippet: string;
  normalizedValue: string;
  confidence: number;
  sourceBoundingBox?: BoundingBox2D;
  matchedAnchor?: string;
  reason: string;
  isSelected: boolean;
}

export interface ExtractedFieldItem {
  fieldName: string;
  label: string;
  value: string | null;
  status: FieldStatus;
  confidence: number; // 0 - 100
  isUserCorrected: boolean;
  originalValue?: string | null;
  sourceTextSnippet?: string | null;
  sourceBoundingBox?: BoundingBox2D;
  extractionMethod?: "CONTEXTUAL_PARSER" | "LINE_PROXIMITY" | "PATTERN_VALIDATOR" | "AI_VISION" | "USER_EDIT";
  reasonForSelection?: string;
  candidates?: ExtractionCandidate[];
  legalReference?: string;
  description?: string;
}

export type ProductCategory =
  | "FOOTWEAR"
  | "APPAREL"
  | "FOOD_BEVERAGE"
  | "COSMETICS_PERSONAL_CARE"
  | "ELECTRONICS"
  | "GENERAL_COMMODITY";

export interface ExtractedProductDeclarations {
  productCategory?: ProductCategory;
  productName: ExtractedFieldItem;
  genericName: ExtractedFieldItem;
  brandName?: ExtractedFieldItem;
  articleCode?: ExtractedFieldItem;
  style?: ExtractedFieldItem;
  colour?: ExtractedFieldItem;
  dimensionOrSize?: ExtractedFieldItem;
  productDescription?: ExtractedFieldItem;
  ingredients?: ExtractedFieldItem;
  manufacturerName: ExtractedFieldItem;
  manufacturerAddress: ExtractedFieldItem;
  packerName?: ExtractedFieldItem;
  packerAddress?: ExtractedFieldItem;
  importerName?: ExtractedFieldItem;
  importerAddress?: ExtractedFieldItem;
  countryOfOrigin: ExtractedFieldItem;
  netQuantity: ExtractedFieldItem;
  netQuantityUnit: ExtractedFieldItem;
  netQuantityValue: ExtractedFieldItem;
  mrp: ExtractedFieldItem;
  mrpInclusiveTaxes: ExtractedFieldItem;
  unitSalePrice: ExtractedFieldItem;
  manufacturingDate: ExtractedFieldItem;
  packagingDate: ExtractedFieldItem;
  expiryDate?: ExtractedFieldItem;
  bestBefore?: ExtractedFieldItem;
  consumerCareName: ExtractedFieldItem;
  consumerCareAddress: ExtractedFieldItem;
  consumerCarePhone: ExtractedFieldItem;
  consumerCareEmail: ExtractedFieldItem;
  batchNumber?: ExtractedFieldItem;
  fssaiNumber?: ExtractedFieldItem;
  otherDeclarations: ExtractedFieldItem[];
}

export interface StatutoryRuleDefinition {
  ruleId: string;
  ruleCode: string;
  name: string;
  category: "IDENTITY" | "QUANTITY" | "PRICING" | "MANUFACTURER" | "CONSUMER_CARE" | "DATES" | "DISPLAY";
  legalReference: string; // e.g. "Rule 6(1)(a), Legal Metrology (Packaged Commodities) Rules, 2011"
  description: string;
  requiredFields: string[];
  severity: ViolationSeverity;
  statutoryMaxPenalty?: string;
}

export type ComplianceRuleDefinition = StatutoryRuleDefinition;

export interface ViolationRecord {
  id: string;
  ruleId: string;
  ruleCode: string;
  ruleName: string;
  category: string;
  status: RuleEvaluationStatus;
  severity: ViolationSeverity;
  detectedValue: string | null;
  expectedRequirement: string;
  legalExplanation: string;
  recommendedCorrection: string;
  statutoryReference: string;
}

export interface ComplianceResult {
  id: string;
  analysisId: string;
  overallStatus: ComplianceStatus;
  complianceScore: number; // 0 - 100
  totalRulesEvaluated: number;
  passedRulesCount: number;
  failedRulesCount: number;
  warningRulesCount: number;
  assessedAt: string;
  violations: ViolationRecord[];
  summaryNote?: string;
}

export interface AnalysisRecord {
  id: string;
  userId: string;
  productName: string;
  status: AnalysisStatus;
  complianceStatus: ComplianceStatus | null;
  complianceScore: number | null;
  errorMessage?: string | null;
  labelImage?: UploadedLabel;
  labelImages?: UploadedLabel[];
  ocrResult?: OcrResult;
  extractedFields?: ExtractedProductDeclarations;
  complianceResult?: ComplianceResult;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalAnalyses: number;
  compliantCount: number;
  partiallyCompliantCount: number;
  nonCompliantCount: number;
  requiresReviewCount: number;
  averageScore: number;
  recentAnalyses: AnalysisRecord[];
  topViolations: Array<{
    ruleCode: string;
    name: string;
    count: number;
    severity: ViolationSeverity;
  }>;
}
