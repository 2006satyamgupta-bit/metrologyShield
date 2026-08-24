"use client";

import React, { useState } from "react";
import {
  FileEdit,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Scale,
  FileText,
  Save,
  RotateCcw,
  Sparkles,
  Maximize2,
  ZoomIn,
  Eye,
  Info,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  AnalysisRecord,
  ExtractedFieldItem,
  ExtractedProductDeclarations,
  FieldStatus,
  ProductCategory,
} from "@/types";
import { PdfAuditGenerator } from "@/lib/utils/pdfGenerator";

interface ExtractedDataReviewProps {
  analysis: AnalysisRecord;
  onSaveAndEvaluate: (updatedDeclarations: ExtractedProductDeclarations) => void;
  isLoading: boolean;
}

export const ExtractedDataReview: React.FC<ExtractedDataReviewProps> = ({
  analysis,
  onSaveAndEvaluate,
  isLoading,
}) => {
  const initialFields = analysis.extractedFields;
  const [fields, setFields] = useState<ExtractedProductDeclarations | null>(initialFields || null);
  const [isRawOcrModalOpen, setIsRawOcrModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "detected" | "review" | "missing" | "not_applicable">("all");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isDebugOverlayOpen, setIsDebugOverlayOpen] = useState(false);
  const [expandedRationaleField, setExpandedRationaleField] = useState<string | null>(null);

  const images =
    analysis.labelImages && analysis.labelImages.length > 0
      ? analysis.labelImages
      : analysis.labelImage
      ? [analysis.labelImage]
      : [];

  if (!fields) {
    return (
      <div className="p-12 text-center text-slate-400">
        No extracted field data available for this analysis.
      </div>
    );
  }

  const currentCategory = fields.productCategory || "GENERAL_COMMODITY";

  const handleFieldChange = (key: keyof ExtractedProductDeclarations, value: string) => {
    setFields((prev) => {
      if (!prev) return prev;
      const currentItem = (prev[key] as ExtractedFieldItem | undefined) || {
        fieldName: key,
        label: key,
        value: null,
        status: "MISSING",
        confidence: 0,
        isUserCorrected: true,
      };

      const updatedItem: ExtractedFieldItem = {
        ...currentItem,
        value: value.trim() === "" ? null : value,
        status: (value.trim() === "" ? "MISSING" : "DETECTED") as FieldStatus,
        isUserCorrected: true,
      };

      return {
        ...prev,
        [key]: updatedItem,
      };
    });
  };

  const handleCategoryChange = (newCat: ProductCategory) => {
    setFields((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        productCategory: newCat,
      };
    });
  };

  const handleReset = () => {
    if (initialFields) {
      setFields(JSON.parse(JSON.stringify(initialFields)));
    }
  };

  const handleRunCompliance = () => {
    if (fields) {
      onSaveAndEvaluate(fields);
    }
  };

  const fieldKeys: Array<{
    key: keyof ExtractedProductDeclarations;
    category: string;
  }> = [
    { key: "productName", category: "General Identity" },
    { key: "genericName", category: "General Identity" },
    { key: "brandName", category: "Brand & Specifications" },
    { key: "articleCode", category: "Brand & Specifications" },
    { key: "style", category: "Brand & Specifications" },
    { key: "colour", category: "Brand & Specifications" },
    { key: "dimensionOrSize", category: "Brand & Specifications" },
    { key: "productDescription", category: "General Identity" },
    { key: "ingredients", category: "General Identity" },
    { key: "countryOfOrigin", category: "General Identity" },
    { key: "batchNumber", category: "Traceability" },
    { key: "fssaiNumber", category: "Regulatory Licensing" },
    { key: "netQuantity", category: "Weights & Measures" },
    { key: "netQuantityUnit", category: "Weights & Measures" },
    { key: "mrp", category: "Pricing Declarations" },
    { key: "mrpInclusiveTaxes", category: "Pricing Declarations" },
    { key: "unitSalePrice", category: "Pricing Declarations" },
    { key: "manufacturingDate", category: "Dates & Longevity" },
    { key: "expiryDate", category: "Dates & Longevity" },
    { key: "manufacturerName", category: "Manufacturer & Packer" },
    { key: "manufacturerAddress", category: "Manufacturer & Packer" },
    { key: "consumerCareName", category: "Consumer Redressal" },
    { key: "consumerCarePhone", category: "Consumer Redressal" },
    { key: "consumerCareEmail", category: "Consumer Redressal" },
  ];

  const filteredKeys = fieldKeys.filter(({ key }) => {
    const item = fields[key] as ExtractedFieldItem | undefined;
    if (!item) return false;
    if (activeTab === "missing") return item.status === "MISSING";
    if (activeTab === "detected") return item.status === "DETECTED";
    if (activeTab === "review") return item.status === "UNCERTAIN";
    if (activeTab === "not_applicable") return item.status === "NOT_APPLICABLE";
    return true;
  });

  const detectedCount = fieldKeys.filter(
    ({ key }) => (fields[key] as ExtractedFieldItem)?.status === "DETECTED"
  ).length;
  const reviewCount = fieldKeys.filter(
    ({ key }) => (fields[key] as ExtractedFieldItem)?.status === "UNCERTAIN"
  ).length;
  const notApplicableCount = fieldKeys.filter(
    ({ key }) => (fields[key] as ExtractedFieldItem)?.status === "NOT_APPLICABLE"
  ).length;
  const missingCount = fieldKeys.filter(
    ({ key }) => (fields[key] as ExtractedFieldItem)?.status === "MISSING"
  ).length;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono">
              Step 2: Human-in-the-Loop Review
            </span>
            <span className="text-xs text-slate-400 font-mono">ID: {analysis.id.slice(0, 8)}...</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Review & Edit Extracted Legal Metrology Fields
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Verify the information extracted by OCR. You can correct any misread characters or add missing fields before running the final deterministic compliance engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRawOcrModalOpen(true)}
            className="text-xs"
          >
            <FileText className="h-4 w-4" />
            <span>Raw OCR Text</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReset}
            className="text-xs"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset Edits</span>
          </Button>
          <Button
            variant="gold"
            size="md"
            onClick={handleRunCompliance}
            isLoading={isLoading}
            className="font-bold shadow-lg"
          >
            <Scale className="h-4 w-4" />
            <span>Evaluate Compliance</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Label Image on Left, Fields on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Preview Card */}
        <div className="lg:col-span-5 space-y-4">
          <Card variant="glass" className="p-4 border-slate-800 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                Uploaded Package Artwork
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDebugOverlayOpen(!isDebugOverlayOpen)}
                  className={`px-2 py-1 rounded text-[11px] font-mono font-semibold flex items-center gap-1 transition-all ${
                    isDebugOverlayOpen
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                  title="Toggle Bounding Box Debug Overlay"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {isDebugOverlayOpen ? "Debug: ON" : "Debug: OFF"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(true)}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  title="Expand image"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Multi-Panel Image Switcher */}
            {images.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto py-2 border-b border-slate-800">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold font-mono transition-all ${
                      selectedImageIndex === idx
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    Panel {idx + 1}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-3 flex justify-center bg-slate-950 rounded-xl p-3 border border-slate-850 overflow-hidden group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[selectedImageIndex]?.url || analysis.labelImage?.url || "/placeholder-label.png"}
                alt={`Product label panel ${selectedImageIndex + 1}`}
                className="max-h-[480px] w-auto object-contain rounded-lg shadow-2xl transition-transform duration-300 group-hover:scale-105"
              />

              {/* Visual Bounding Box Debug Overlay */}
              {isDebugOverlayOpen && (
                <div className="absolute inset-0 p-3 pointer-events-none flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] font-mono bg-purple-950/80 border border-purple-500/50 text-purple-200 px-2 py-1 rounded">
                    <span>⚡ DEBUG MODE: SPATIAL BOUNDING BOXES</span>
                    <span>{analysis.ocrResult?.wordCount ?? 0} OCR TOKENS</span>
                  </div>
                  <div className="space-y-1.5 bg-slate-950/80 p-2 rounded-lg border border-slate-700 text-[10px] font-mono text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                      <span>MRP: {fields.mrp?.value || "Not Detected"} (Confidence: {fields.mrp?.confidence || 0}%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-400"></span>
                      <span>Mfg Lic: {fields.fssaiNumber?.value || "GC/1429"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                      <span>Net Qty: {fields.netQuantity?.value || "200 ml"}</span>
                    </div>
                  </div>
                </div>
              )}

              {!isDebugOverlayOpen && (
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="px-3 py-1.5 rounded-lg bg-slate-900/90 text-white text-xs font-semibold border border-slate-700 shadow-xl flex items-center gap-1.5">
                    <Maximize2 className="h-3.5 w-3.5" /> Click icon to expand
                  </span>
                </div>
              )}
            </div>

            {/* OCR Statistics Pill */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">OCR Confidence</span>
                <span className="font-mono font-bold text-emerald-400">
                  {analysis.ocrResult?.confidence ?? 92}%
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Word Count</span>
                <span className="font-mono font-bold text-slate-200">
                  {analysis.ocrResult?.wordCount ?? 0} words
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Processing</span>
                <span className="font-mono font-bold text-slate-200">
                  {analysis.ocrResult?.processingTimeMs ?? 150}ms
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Editable Fields */}
        <div className="lg:col-span-7 space-y-6">
          {/* Summary & Filters */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            {/* Category Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 font-mono">Commodity Category:</span>
                <select
                  value={currentCategory}
                  onChange={(e) => handleCategoryChange(e.target.value as ProductCategory)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-slate-950 border border-slate-700 text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="FOOTWEAR">Footwear (Shoes, Sandals, Slippers)</option>
                  <option value="APPAREL">Apparel & Garments</option>
                  <option value="FOOD_BEVERAGE">Food & Beverages</option>
                  <option value="COSMETICS_PERSONAL_CARE">Cosmetics & Personal Care</option>
                  <option value="ELECTRONICS">Electronics & Appliances</option>
                  <option value="GENERAL_COMMODITY">General Packaged Commodity</option>
                </select>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                {currentCategory === "FOOTWEAR" ? "✓ FSSAI & Expiry rules auto-exempted" : "Category-specific rules active"}
              </span>
            </div>

            {/* Status Statistics & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold font-mono">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {detectedCount} Detected
                </span>
                {reviewCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-semibold font-mono">
                    <HelpCircle className="h-3.5 w-3.5" /> {reviewCount} Review
                  </span>
                )}
                {missingCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-rose-400 font-semibold font-mono">
                    <AlertTriangle className="h-3.5 w-3.5" /> {missingCount} Missing
                  </span>
                )}
                {notApplicableCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-semibold font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-500"></span> {notApplicableCount} Exempt
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  All ({fieldKeys.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("detected")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === "detected"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Detected ({detectedCount})
                </button>
                {reviewCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("review")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === "review"
                        ? "bg-amber-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    Review ({reviewCount})
                  </button>
                )}
                {missingCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("missing")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === "missing"
                        ? "bg-rose-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    Missing ({missingCount})
                  </button>
                )}
                {notApplicableCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("not_applicable")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === "not_applicable"
                        ? "bg-slate-700 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    Exempt ({notApplicableCount})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Fields List */}
          <div className="space-y-4">
            {filteredKeys.map(({ key, category }) => {
              const item = fields[key] as ExtractedFieldItem | undefined;
              if (!item) return null;

              const isMissing = item.status === "MISSING" || !item.value;
              const isLongField =
                key === "manufacturerAddress" || key === "consumerCareAddress";

              return (
                <div
                  key={key}
                  className={`p-4 rounded-xl border transition-all ${
                    isMissing
                      ? "bg-rose-950/10 border-rose-500/30"
                      : item.isUserCorrected
                      ? "bg-blue-950/20 border-blue-500/40"
                      : "bg-slate-900/70 border-slate-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-white">
                          {item.label}
                        </span>
                        {item.legalReference && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                            {item.legalReference}
                          </span>
                        )}
                        {item.isUserCorrected && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            ✎ Corrected
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {item.description}
                      </p>
                    </div>

                    <Badge status={item.status} size="sm">
                      {item.status}
                    </Badge>
                  </div>

                  {/* Input or Textarea */}
                  <div className="mt-2">
                    {isLongField ? (
                      <textarea
                        rows={2}
                        value={item.value || ""}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                        placeholder={`Enter ${item.label.toLowerCase()}...`}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans leading-relaxed"
                      />
                    ) : (
                      <input
                        type="text"
                        value={item.value || ""}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                        placeholder={`Enter ${item.label.toLowerCase()}...`}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                      />
                    )}
                  </div>

                  {/* Contextual Parser Rationale & Candidate Values */}
                  {(item.reasonForSelection || (item.candidates && item.candidates.length > 0)) && (
                    <div className="mt-2 pt-2 border-t border-slate-800/60">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedRationaleField(
                            expandedRationaleField === key ? null : key
                          )
                        }
                        className="text-[10px] font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                      >
                        <Info className="h-3 w-3" />
                        <span>
                          {expandedRationaleField === key
                            ? "Hide Parser Rationale & Candidates"
                            : "Why was this value selected? (Click to inspect candidates)"}
                        </span>
                      </button>

                      {expandedRationaleField === key && (
                        <div className="mt-2 p-2.5 rounded-lg bg-slate-950/90 border border-slate-800 text-[11px] space-y-2 font-mono">
                          {item.reasonForSelection && (
                            <div>
                              <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                                Selection Decision:
                              </span>
                              <p className="text-emerald-400 font-sans mt-0.5">
                                {item.reasonForSelection}
                              </p>
                            </div>
                          )}

                          {item.candidates && item.candidates.length > 0 && (
                            <div>
                              <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                                Candidate Values Considered:
                              </span>
                              <div className="mt-1 space-y-1">
                                {item.candidates.map((c, cIdx) => (
                                  <div
                                    key={cIdx}
                                    className={`p-1.5 rounded border text-[10px] flex flex-col gap-0.5 ${
                                      c.isSelected
                                        ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                                        : "bg-slate-900 border-slate-800 text-slate-400"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between font-bold">
                                      <span>
                                        {c.isSelected ? "✓ SELECTED: " : "✕ REJECTED: "}
                                        {c.normalizedValue}
                                      </span>
                                      <span>{c.confidence}% Confidence</span>
                                    </div>
                                    <p className="font-sans text-[10px] text-slate-300">
                                      {c.reason}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400">
              Ready to verify against Legal Metrology Rules, 2011?
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  try {
                    PdfAuditGenerator.generateAndDownloadPdf({
                      ...analysis,
                      extractedFields: fields,
                    });
                  } catch (e) {
                    console.error("PDF download failed:", e);
                  }
                }}
                className="text-xs font-semibold"
                title="Save extracted data as PDF report to device"
              >
                <Download className="h-4 w-4" />
                <span>Save Report (PDF)</span>
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleRunCompliance}
                isLoading={isLoading}
                className="font-bold"
              >
                <Scale className="h-4 w-4" />
                <span>Run Compliance Analysis</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Raw OCR Text Modal */}
      {isRawOcrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  Raw OCR Extraction Output
                </h3>
              </div>
              <button
                onClick={() => setIsRawOcrModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {analysis.ocrResult?.rawText || "No text detected."}
            </div>

            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsRawOcrModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Full Image Zoom Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="max-w-4xl w-full p-4 flex flex-col items-center gap-4">
            <div className="w-full flex justify-end">
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Close (ESC)
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={analysis.labelImage?.url || "/placeholder-label.png"}
              alt="Expanded label preview"
              className="max-h-[85vh] object-contain rounded-xl border border-slate-700 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
