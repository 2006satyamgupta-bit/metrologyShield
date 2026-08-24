"use client";

import React, { useEffect, useState } from "react";
import {
  Upload,
  ScanText,
  Sparkles,
  Scale,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ProcessingStepProps {
  status: string;
  errorMessage?: string | null;
  onRetry?: () => void;
}

export const ProcessingStep: React.FC<ProcessingStepProps> = ({
  status,
  errorMessage,
  onRetry,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const stages = [
    {
      key: "UPLOADING",
      title: "Storage Ingestion",
      description: "Validating MIME format, calculating hashes, and persisting to storage",
      icon: Upload,
    },
    {
      key: "OCR_PROCESSING",
      title: "Optical Character Recognition (OCR)",
      description: "Extracting raw text, word confidence bounding boxes, and label typography",
      icon: ScanText,
    },
    {
      key: "EXTRACTING",
      title: "AI Structured Declaration Parsing",
      description: "Mapping unstructured text into statutory fields under LMPC Rules 2011",
      icon: Sparkles,
    },
    {
      key: "ANALYZING",
      title: "Deterministic Statutory Rule Engine",
      description: "Evaluating against Section 36 & Rules 6, 11, 13, 18, and 27",
      icon: Scale,
    },
  ];

  const getStageState = (stageKey: string) => {
    const order = ["UPLOADING", "OCR_PROCESSING", "EXTRACTING", "ANALYZING", "COMPLETED"];
    const currentIndex = order.indexOf(status);
    const stageIndex = order.indexOf(stageKey);

    if (errorMessage) {
      if (stageIndex === currentIndex) return "error";
      if (stageIndex < currentIndex) return "completed";
      return "pending";
    }

    if (stageIndex < currentIndex) return "completed";
    if (stageIndex === currentIndex) return "active";
    return "pending";
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Analyzing Product Label Against Legal Metrology Standards
        </h2>
        <p className="text-slate-400 text-sm">
          Processing label artwork through our multi-stage OCR, AI extraction, and statutory rules engine.
        </p>
      </div>

      <Card variant="glass" className="p-8 border-slate-800">
        <div className="space-y-8">
          {/* Top Progress Overview */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              {!errorMessage ? (
                <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
              ) : (
                <AlertCircle className="h-6 w-6 text-rose-400" />
              )}
              <div>
                <h4 className="text-sm font-semibold text-white">
                  {errorMessage
                    ? "Analysis Pipeline Error"
                    : status === "OCR_PROCESSING"
                    ? "Executing Optical Character Recognition..."
                    : status === "EXTRACTING"
                    ? "AI Extracting Packaged Commodity Declarations..."
                    : status === "ANALYZING"
                    ? "Evaluating Compliance Against LMPC 2011..."
                    : "Processing Label Artwork..."}
                </h4>
                <p className="text-xs text-slate-400">
                  {errorMessage
                    ? "The process was interrupted."
                    : `Time elapsed: ${elapsedSeconds}s — DO NOT refresh the page`}
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {status}
            </span>
          </div>

          {/* Stepper Stages */}
          <div className="space-y-4">
            {stages.map((stage, idx) => {
              const state = getStageState(stage.key);
              const Icon = stage.icon;

              return (
                <div
                  key={stage.key}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-300 ${
                    state === "active"
                      ? "bg-blue-600/10 border-blue-500/40 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/20"
                      : state === "completed"
                      ? "bg-slate-900/60 border-slate-800 text-slate-300"
                      : state === "error"
                      ? "bg-rose-950/40 border-rose-500/40 text-rose-300"
                      : "bg-slate-950/40 border-slate-850 opacity-40"
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border ${
                      state === "active"
                        ? "bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/30"
                        : state === "completed"
                        ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/30"
                        : state === "error"
                        ? "bg-rose-950 text-rose-400 border-rose-500/40"
                        : "bg-slate-900 text-slate-500 border-slate-800"
                    }`}
                  >
                    {state === "completed" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : state === "active" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h5
                        className={`text-sm font-semibold ${
                          state === "active"
                            ? "text-white"
                            : state === "completed"
                            ? "text-slate-200"
                            : state === "error"
                            ? "text-rose-300"
                            : "text-slate-500"
                        }`}
                      >
                        Stage {idx + 1}: {stage.title}
                      </h5>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                        {state === "completed"
                          ? "✓ Done"
                          : state === "active"
                          ? "In Progress..."
                          : state === "error"
                          ? "✕ Failed"
                          : "Waiting"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {stage.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Error & Retry action */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-rose-300 uppercase tracking-wider font-mono">
                    Pipeline Execution Error
                  </h4>
                  <p className="text-xs text-rose-200">{errorMessage}</p>
                </div>
              </div>
              {onRetry && (
                <div className="flex justify-end pt-2">
                  <Button variant="danger" size="sm" onClick={onRetry}>
                    Retry Analysis
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
