"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Upload,
  Image as ImageIcon,
  AlertCircle,
  FileCheck,
  Sparkles,
  ArrowRight,
  X,
  Layers,
  Clock,
  ExternalLink,
  RotateCcw,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AnalysisRecord } from "@/types";
import { formatDate } from "@/lib/utils";

export interface SelectedImageItem {
  id: string;
  file: File;
  previewUrl: string;
  panelLabel: string;
}

interface UploadStepProps {
  onUploadSubmit: (files: File[], productName: string) => void;
  isLoading: boolean;
}

export const UploadStep: React.FC<UploadStepProps> = ({
  onUploadSubmit,
  isLoading,
}) => {
  const [selectedImages, setSelectedImages] = useState<SelectedImageItem[]>([]);
  const [productName, setProductName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisRecord[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadRecent() {
      try {
        const res = await fetch("/api/analyze?userId=default-user&sortBy=date_desc");
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setRecentAnalyses(data.data.slice(0, 3));
        }
      } catch (err) {
        // Non-blocking
      }
    }
    loadRecent();
  }, []);

  const optimizeImageForOcr = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const maxDim = 1600;
        let width = img.width;
        let height = img.height;

        if (width <= maxDim && height <= maxDim) {
          resolve(file);
          return;
        }

        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const optimized = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(optimized);
          },
          "image/jpeg",
          0.92
        );
      };
      img.onerror = () => resolve(file);
      img.src = url;
    });
  };

  const handleAddFiles = async (fileList: FileList | File[]) => {
    setError(null);
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    const newItems: SelectedImageItem[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!validTypes.includes(file.type.toLowerCase())) {
        setError(`Skipped ${file.name}: Only PNG, JPEG, and WEBP formats supported.`);
        continue;
      }
      if (file.size > 15 * 1024 * 1024) {
        setError(`Skipped ${file.name}: Exceeds 15MB size limit.`);
        continue;
      }

      const optimized = await optimizeImageForOcr(file);
      const url = URL.createObjectURL(optimized);
      const defaultLabel =
        selectedImages.length + newItems.length === 0
          ? "Front (PDP)"
          : selectedImages.length + newItems.length === 1
          ? "Back Panel"
          : `Side / Detail ${selectedImages.length + newItems.length + 1}`;

      newItems.push({
        id: Math.random().toString(36).substring(2, 9),
        file: optimized,
        previewUrl: url,
        panelLabel: defaultLabel,
      });

      if (!productName && selectedImages.length === 0 && newItems.length === 1) {
        const cleanName = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        setProductName(cleanName);
      }
    }

    if (newItems.length > 0) {
      setSelectedImages((prev) => [...prev, ...newItems]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = (id: string) => {
    setSelectedImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleLabelChange = (id: string, label: string) => {
    setSelectedImages((prev) =>
      prev.map((item) => (item.id === id ? { ...item, panelLabel: label } : item))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedImages.length === 0) {
      setError("Please upload at least one packaging label image (Front, Back, or Side).");
      return;
    }
    const files = selectedImages.map((item) => item.file);
    onUploadSubmit(files, productName || "Untitled Package Label");
  };

  // Helper to generate realistic sample package labels on the fly using HTML Canvas
  const loadSamplePackaging = (sampleType: "compliant" | "non_compliant" | "incomplete_care") => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 800, 1000);
    bgGrad.addColorStop(0, "#ffffff");
    bgGrad.addColorStop(1, "#f1f5f9");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 1000);

    // Outer border
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, 760, 960);

    let sampleTitle = "";
    let fileName = "";

    if (sampleType === "compliant") {
      sampleTitle = "APEX CASHEW DELIGHTS 250g";
      fileName = "apex-cashews-compliant-sample.png";
      ctx.fillStyle = "#047857";
      ctx.fillRect(20, 20, 760, 120);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(sampleTitle, 400, 90);

      ctx.textAlign = "left";
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 20px Arial, sans-serif";

      let y = 180;
      ctx.fillText("MANDATORY STATUTORY DECLARATIONS", 50, y);
      y += 40;

      ctx.font = "18px Arial, sans-serif";
      ctx.fillText("Generic Name: Roasted & Salted Cashew Kernels", 50, y);
      y += 35;
      ctx.fillText("Net Quantity: 250 g", 50, y);
      y += 35;
      ctx.fillText("MRP: Rs. 350.00 (incl. of all taxes)", 50, y);
      y += 35;
      ctx.fillText("Unit Sale Price: Rs. 1.40 / g", 50, y);
      y += 35;
      ctx.fillText("Country of Origin: India", 50, y);
      y += 35;
      ctx.fillText("Date of Manufacture: 04/2024", 50, y);
      y += 35;
      ctx.fillText("Best Before: 6 months from packaging", 50, y);
      y += 50;

      ctx.font = "bold 18px Arial, sans-serif";
      ctx.fillText("Manufactured & Packed By:", 50, y);
      y += 28;
      ctx.font = "16px Arial, sans-serif";
      ctx.fillText("Apex Foods Private Limited, Plot 45, Sector 18,", 50, y);
      y += 24;
      ctx.fillText("Industrial Area, Gurgaon, Haryana - 122015", 50, y);
      y += 50;

      ctx.font = "bold 18px Arial, sans-serif";
      ctx.fillText("Customer Care Grievance Redressal:", 50, y);
      y += 28;
      ctx.font = "16px Arial, sans-serif";
      ctx.fillText("Executive: Grievance Officer, Apex Foods Ltd.", 50, y);
      y += 24;
      ctx.fillText("Toll Free: 1800-111-9999 | Email: care@apexfoods.in", 50, y);
    } else if (sampleType === "non_compliant") {
      sampleTitle = "SPARKLE ULTRA DETERGENT";
      fileName = "sparkle-detergent-violations-sample.png";
      ctx.fillStyle = "#b91c1c";
      ctx.fillRect(20, 20, 760, 120);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(sampleTitle, 400, 90);

      ctx.textAlign = "left";
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 20px Arial, sans-serif";

      let y = 180;
      ctx.fillText("PRODUCT DETAILS", 50, y);
      y += 40;

      ctx.font = "18px Arial, sans-serif";
      ctx.fillText("Generic Name: Washing Powder", 50, y);
      y += 35;
      // Violation 1: Illegal abbreviation 'gms' under Rule 13
      ctx.fillText("Net Wt: 500 gms", 50, y);
      y += 35;
      // Violation 2: Missing '(incl. of all taxes)' statement under Rule 6(1)(e)
      ctx.fillText("MRP: Rs. 95.00", 50, y);
      y += 35;
      // Violation 3: Missing Country of Origin under Rule 6(1)(a)
      // Violation 4: Missing Month & Year of packing under Rule 6(1)(d)
      ctx.fillText("Batch No: SPK-2024-09", 50, y);
      y += 50;

      ctx.font = "bold 18px Arial, sans-serif";
      ctx.fillText("Manufactured By:", 50, y);
      y += 28;
      ctx.font = "16px Arial, sans-serif";
      // Violation 5: Incomplete address without PIN code
      ctx.fillText("Sparkle Chemical Corp, Phase 2, Industrial Belt", 50, y);
      y += 50;

      ctx.font = "bold 18px Arial, sans-serif";
      ctx.fillText("Contact Us:", 50, y);
      y += 28;
      ctx.font = "16px Arial, sans-serif";
      // Violation 6: Missing email channel under Rule 6(1)(f)
      ctx.fillText("Helpline: 9876543210", 50, y);
    } else {
      sampleTitle = "GLOW HERBAL FACE WASH";
      fileName = "glow-facewash-sample.png";
      ctx.fillStyle = "#4338ca";
      ctx.fillRect(20, 20, 760, 120);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(sampleTitle, 400, 90);

      ctx.textAlign = "left";
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 20px Arial, sans-serif";

      let y = 180;
      ctx.fillText("PRODUCT SPECIFICATION", 50, y);
      y += 40;

      ctx.font = "18px Arial, sans-serif";
      ctx.fillText("Generic Name: Purifying Neem Face Wash", 50, y);
      y += 35;
      ctx.fillText("Net Quantity: 150 ml", 50, y);
      y += 35;
      ctx.fillText("MRP: Rs. 180.00 (inclusive of all taxes)", 50, y);
      y += 35;
      ctx.fillText("Country of Origin: India", 50, y);
      y += 35;
      ctx.fillText("Mfg Date: 02/2024", 50, y);
      y += 50;

      ctx.font = "bold 18px Arial, sans-serif";
      ctx.fillText("Manufactured By:", 50, y);
      y += 28;
      ctx.font = "16px Arial, sans-serif";
      ctx.fillText("Glow Naturals Ltd, Plot 12, Biotech Park, Pune, Maharashtra - 411001", 50, y);
      y += 50;

      ctx.font = "bold 18px Arial, sans-serif";
      ctx.fillText("Consumer Care:", 50, y);
      y += 28;
      ctx.font = "16px Arial, sans-serif";
      ctx.fillText("Email: feedback@glownaturals.in", 50, y);
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], fileName, { type: "image/png" });
      handleAddFiles([file]);
    }, "image/png");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Step Header */}
      <div className="text-center space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
          <Layers className="h-3.5 w-3.5" /> Step 1: Multi-Panel Label Ingestion
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Upload Packaged Commodity Label Artwork
        </h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
          Upload one or multiple photos/artwork panels (Front PDP, Back Declarations, Side Panels, Base). Our multi-image OCR engine merges and audits all statutory declarations together.
        </p>
      </div>

      {/* Recently Uploaded Labels / Quick Resume */}
      {recentAnalyses.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-blue-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider font-mono">
              <Clock className="h-4 w-4" />
              <span>Recent Packaging Audits (Click to Open & View Without Re-uploading)</span>
            </div>
            <Link href="/history" className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1">
              View All <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recentAnalyses.map((rec) => (
              <Link
                key={rec.id}
                href={`/analyze/${rec.id}`}
                className="p-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/40 transition-all flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                    {rec.productName || "Packaged Product"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {formatDate(rec.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge
                    variant={
                      rec.complianceStatus === "COMPLIANT"
                        ? "success"
                        : rec.complianceStatus === "NON_COMPLIANT"
                        ? "danger"
                        : "warning"
                    }
                    size="sm"
                  >
                    {rec.complianceScore ?? 0}%
                  </Badge>
                  <RotateCcw className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Sample Selector */}
      <Card variant="glass" className="border-slate-800 bg-slate-900/40">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                Instant Test Labels
              </h4>
              <p className="text-xs text-slate-400">
                Load real statutory test labels to verify compliance engine evaluation
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadSamplePackaging("compliant")}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/60 transition-colors"
            >
              ✓ Compliant Snack (100%)
            </button>
            <button
              type="button"
              onClick={() => loadSamplePackaging("non_compliant")}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-950/60 border border-rose-500/30 text-rose-300 hover:bg-rose-900/60 transition-colors"
            >
              ⚠ Non-Compliant (Rule 13 "gms")
            </button>
            <button
              type="button"
              onClick={() => loadSamplePackaging("incomplete_care")}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-950/60 border border-amber-500/30 text-amber-300 hover:bg-amber-900/60 transition-colors"
            >
              ℹ Cosmetic (Missing Phone)
            </button>
          </div>
        </div>
      </Card>

      {/* Form Area */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product / SKU Reference */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Product SKU / Brand Name (Optional)
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g. Apex Roasted Cashews 250g / Velvet Body Wash 200ml"
            className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
          />
        </div>

        {/* Selected Images Grid */}
        {selectedImages.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Uploaded Packaging Panels ({selectedImages.length})
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add Another Panel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {selectedImages.map((item, index) => (
                <div
                  key={item.id}
                  className="relative p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 space-y-3 group"
                >
                  <div className="relative h-44 rounded-lg overflow-hidden bg-slate-950 border border-slate-800/80 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.previewUrl}
                      alt={item.panelLabel}
                      className="max-h-full max-w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(item.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 hover:bg-rose-900 transition-colors shadow-lg"
                      title="Remove image"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <input
                      type="text"
                      value={item.panelLabel}
                      onChange={(e) => handleLabelChange(item.id, e.target.value)}
                      placeholder={`Panel ${index + 1}`}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                    <p className="text-[10px] text-slate-400 truncate">
                      {item.file.name} ({(item.file.size / 1024).toFixed(0)} KB)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragOver
              ? "border-blue-500 bg-blue-500/5 shadow-inner"
              : "border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/60"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleAddFiles(e.target.files);
              }
            }}
          />

          <div className="space-y-3 max-w-sm mx-auto">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/5">
              <Upload className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">
                {selectedImages.length > 0
                  ? "Click or drop more photos to add other package panels"
                  : "Click or drag & drop packaging label artwork"}
              </p>
              <p className="text-xs text-slate-400">
                Supports Front, Back, Nutritional, and Side panels (PNG, JPG, WEBP up to 15MB each)
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit CTA */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={selectedImages.length === 0 || isLoading}
            className="w-full sm:w-auto shadow-lg shadow-blue-600/20"
          >
            <FileCheck className="h-4 w-4" />
            <span>
              {isLoading
                ? "Processing Label Artwork..."
                : `Run Multi-Panel Inspection (${selectedImages.length} Image${selectedImages.length === 1 ? "" : "s"})`}
            </span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};
