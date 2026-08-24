"use client";

import React, { useState, useEffect } from "react";
import { UploadStep } from "@/components/analysis/UploadStep";
import { ProcessingStep } from "@/components/analysis/ProcessingStep";
import { ExtractedDataReview } from "@/components/analysis/ExtractedDataReview";
import { ComplianceResultsView } from "@/components/analysis/ComplianceResultsView";
import { AnalysisRecord, ExtractedProductDeclarations } from "@/types";
import { useAuth } from "@/lib/auth/authContext";

interface AnalysisWizardProps {
  initialAnalysis?: AnalysisRecord | null;
}

export const AnalysisWizard: React.FC<AnalysisWizardProps> = ({
  initialAnalysis = null,
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<"UPLOAD" | "PROCESSING" | "REVIEW" | "RESULTS">(
    initialAnalysis
      ? initialAnalysis.status === "COMPLETED"
        ? "RESULTS"
        : "REVIEW"
      : "UPLOAD"
  );
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(initialAnalysis);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("UPLOADING");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUploadSubmit = async (files: File[] | File, productName: string) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setCurrentStep("PROCESSING");
    setProcessingStatus("UPLOADING");

    // Smooth responsive progression
    const timer1 = setTimeout(() => setProcessingStatus("OCR_PROCESSING"), 600);

    try {
      const fileArray = Array.isArray(files) ? files : [files];
      const formData = new FormData();
      fileArray.forEach((f) => formData.append("files", f));
      formData.append("productName", productName);
      formData.append("userId", user?.id || "default-user");

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      clearTimeout(timer1);
      setProcessingStatus("EXTRACTING");

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to process packaging label artwork.");
      }

      setProcessingStatus("ANALYZING");
      setAnalysis(data.data);

      if (typeof window !== "undefined") {
        localStorage.setItem("metrology_last_analysis_id", data.data.id);
        window.history.pushState({}, "", `/analyze/${data.data.id}`);
      }

      setTimeout(() => {
        setCurrentStep("REVIEW");
      }, 350);
    } catch (err: any) {
      clearTimeout(timer1);
      console.error("Upload error:", err);
      setErrorMessage(err.message || "An unexpected error occurred during processing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndEvaluate = async (
    updatedDeclarations: ExtractedProductDeclarations
  ) => {
    if (!analysis) return;
    setIsSubmitting(true);
    setCurrentStep("PROCESSING");
    setProcessingStatus("ANALYZING");
    try {
      const response = await fetch(`/api/analyze/${analysis.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || "default-user",
          extractedFields: updatedDeclarations,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update compliance analysis.");
      }

      setAnalysis(data.data);

      if (typeof window !== "undefined") {
        localStorage.setItem("metrology_last_analysis_id", data.data.id);
        window.history.pushState({}, "", `/analyze/${data.data.id}`);
      }

      setTimeout(() => {
        setCurrentStep("RESULTS");
      }, 300);
    } catch (err: any) {
      alert(`Error updating analysis: ${err.message}`);
      setCurrentStep("REVIEW");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {currentStep === "UPLOAD" && (
        <UploadStep
          onUploadSubmit={handleUploadSubmit}
          isLoading={isSubmitting}
        />
      )}

      {currentStep === "PROCESSING" && (
        <ProcessingStep
          status={processingStatus}
          errorMessage={errorMessage}
          onRetry={() => {
            setErrorMessage(null);
            setCurrentStep("UPLOAD");
          }}
        />
      )}

      {currentStep === "REVIEW" && analysis && (
        <ExtractedDataReview
          analysis={analysis}
          onSaveAndEvaluate={handleSaveAndEvaluate}
          isLoading={isSubmitting}
        />
      )}

      {currentStep === "RESULTS" && analysis && (
        <ComplianceResultsView
          analysis={analysis}
          onEditAndReevaluate={() => setCurrentStep("REVIEW")}
        />
      )}
    </div>
  );
};
