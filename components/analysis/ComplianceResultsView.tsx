"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  FileCheck,
  Printer,
  RotateCcw,
  PlusCircle,
  Scale,
  FileText,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  Download,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  AnalysisRecord,
  RuleEvaluationStatus,
  ViolationRecord,
} from "@/types";
import { formatDate } from "@/lib/utils";
import { PdfAuditGenerator } from "@/lib/utils/pdfGenerator";

interface ComplianceResultsViewProps {
  analysis: AnalysisRecord;
  onEditAndReevaluate?: () => void;
}

export const ComplianceResultsView: React.FC<ComplianceResultsViewProps> = ({
  analysis,
  onEditAndReevaluate,
}) => {
  const result = analysis.complianceResult;
  const [filter, setFilter] = useState<"ALL" | "VIOLATIONS" | "WARNINGS" | "PASS">("ALL");
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!result) {
    return (
      <div className="p-12 text-center text-slate-400">
        No compliance evaluation results recorded for this analysis.
      </div>
    );
  }

  const violations = result.violations || [];
  const criticalViolations = violations.filter((v) => v.severity === "CRITICAL" && v.status === "VIOLATION");
  const highViolations = violations.filter((v) => v.severity === "HIGH" && v.status === "VIOLATION");
  const filteredViolations = violations.filter((v) => {
    if (filter === "VIOLATIONS") return v.status === "VIOLATION";
    if (filter === "WARNINGS") return v.status === "WARNING";
    if (filter === "PASS") return v.status === "PASS";
    return true;
  });

  const handleDownloadPdf = () => {
    setIsDownloadingPdf(true);
    try {
      PdfAuditGenerator.generateAndDownloadPdf(analysis);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error("Direct PDF generation error:", err);
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLIANT":
        return "text-emerald-400 border-emerald-500/40 bg-emerald-950/40";
      case "PARTIALLY_COMPLIANT":
      case "REQUIRES_REVIEW":
        return "text-amber-400 border-amber-500/40 bg-amber-950/40";
      case "NON_COMPLIANT":
        return "text-rose-400 border-rose-500/40 bg-rose-950/40";
      default:
        return "text-slate-300 border-slate-700 bg-slate-900";
    }
  };

  return (
    <div className="space-y-8 print:space-y-4 print:text-black">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 print:hidden">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-mono text-slate-300 font-semibold">SKU: {analysis.productName}</span>
          <span>•</span>
          <span>Assessed: {formatDate(result.assessedAt)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onEditAndReevaluate && (
            <Button variant="outline" size="sm" onClick={onEditAndReevaluate}>
              <RotateCcw className="h-4 w-4" />
              <span>Modify & Re-evaluate</span>
            </Button>
          )}
          <Button
            variant="gold"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="font-bold shadow-md shadow-amber-500/20"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-950" />
                <span>PDF Downloaded to Device!</span>
              </>
            ) : isDownloadingPdf ? (
              <>
                <div className="h-4 w-4 border-2 border-amber-950 border-t-transparent rounded-full animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Generate & Download PDF Certificate</span>
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} title="Open print dialog">
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </Button>
          <Link href="/analyze/new">
            <Button variant="primary" size="sm">
              <PlusCircle className="h-4 w-4" />
              <span>Analyze Another Label</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Printable Certificate Header (visible in print/PDF mode) */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase text-slate-900 tracking-tight">METROLOGYSHIELD</h1>
            <p className="text-xs text-slate-600 font-semibold">Official Legal Metrology Packaging Compliance Audit Certificate</p>
            <p className="text-[10px] text-slate-500">Legal Metrology (Packaged Commodities) Rules, 2011 & Legal Metrology Act, 2009</p>
          </div>
          <div className="text-right text-xs">
            <p className="font-mono font-bold">Audit ID: {analysis.id.slice(0, 12)}...</p>
            <p className="text-slate-600">Issued: {formatDate(result.assessedAt)}</p>
            <p className="text-slate-900 font-bold">SKU: {analysis.productName}</p>
          </div>
        </div>
      </div>

      {/* Hero Compliance Result Card */}
      <Card
        variant="glass"
        className={`p-8 border-2 transition-all ${
          result.overallStatus === "COMPLIANT"
            ? "border-emerald-500/40 bg-emerald-950/10 shadow-emerald-500/5"
            : result.overallStatus === "NON_COMPLIANT"
            ? "border-rose-500/40 bg-rose-950/10 shadow-rose-500/5"
            : "border-amber-500/40 bg-amber-950/10 shadow-amber-500/5"
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Status & Title */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge status={result.overallStatus} size="lg" className="text-sm px-3.5 py-1">
                {result.overallStatus.replace("_", " ")}
              </Badge>
              <span className="text-xs font-mono text-slate-400">
                Rulebook: LMPC Rules, 2011 (As Amended)
              </span>
            </div>

            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                {analysis.productName}
              </h1>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                {result.summaryNote || "Statutory Legal Metrology verification completed."}
              </p>
            </div>

            {/* Quick Warning Callout if Non-Compliant */}
            {criticalViolations.length > 0 && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
                <AlertOctagon className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Statutory Risk Notice:</strong> {criticalViolations.length} critical breach(es) detected. Manufacturing or distributing this package violates Section 36 of the Legal Metrology Act, 2009.
                </span>
              </div>
            )}
          </div>

          {/* Radial Score Gauge */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
            <div className="relative flex items-center justify-center h-32 w-32">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  className="text-slate-800"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
                <circle
                  className={
                    result.complianceScore >= 85
                      ? "text-emerald-500"
                      : result.complianceScore >= 60
                      ? "text-amber-500"
                      : "text-rose-500"
                  }
                  strokeWidth="8"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * result.complianceScore) / 100}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-extrabold text-white font-mono">
                  {result.complianceScore}%
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                  Score
                </span>
              </div>
            </div>
            <span className="text-xs text-slate-400 mt-2 font-medium">
              Statutory Conformity Index
            </span>
          </div>
        </div>
      </Card>

      {/* KPI Metric Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-mono block">
            Rules Checked
          </span>
          <span className="text-2xl font-bold text-white font-mono mt-1 block">
            {result.totalRulesEvaluated}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
          <span className="text-xs text-emerald-400 uppercase tracking-wider font-mono block">
            Passed Rules
          </span>
          <span className="text-2xl font-bold text-emerald-300 font-mono mt-1 block">
            {result.passedRulesCount}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20">
          <span className="text-xs text-rose-400 uppercase tracking-wider font-mono block">
            Violations
          </span>
          <span className="text-2xl font-bold text-rose-300 font-mono mt-1 block">
            {result.failedRulesCount}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20">
          <span className="text-xs text-amber-400 uppercase tracking-wider font-mono block">
            Warnings
          </span>
          <span className="text-2xl font-bold text-amber-300 font-mono mt-1 block">
            {result.warningRulesCount}
          </span>
        </div>
      </div>

      {/* Detailed Rules Breakdown Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Statutory Rules & Violations Breakdown
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive rule-by-rule evaluation under Indian Legal Metrology Rules, 2011.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                filter === "ALL" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              All ({violations.length})
            </button>
            <button
              onClick={() => setFilter("VIOLATIONS")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                filter === "VIOLATIONS" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Violations ({result.failedRulesCount})
            </button>
            <button
              onClick={() => setFilter("WARNINGS")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                filter === "WARNINGS" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Warnings ({result.warningRulesCount})
            </button>
            <button
              onClick={() => setFilter("PASS")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                filter === "PASS" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Passed ({result.passedRulesCount})
            </button>
          </div>
        </div>

        {/* Violations Cards List */}
        <div className="space-y-4">
          {filteredViolations.map((v) => {
            const isExpanded = expandedCardId === v.id;
            const isViolation = v.status === "VIOLATION";
            const isWarning = v.status === "WARNING";
            const isPass = v.status === "PASS";

            return (
              <Card
                key={v.id}
                variant="glass"
                className={`p-6 border transition-all ${
                  isViolation
                    ? "border-rose-500/40 bg-rose-950/10"
                    : isWarning
                    ? "border-amber-500/40 bg-amber-950/10"
                    : "border-slate-800 bg-slate-900/60"
                }`}
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                          {v.ruleCode}
                        </span>
                        <h4 className="text-base font-bold text-white">
                          {v.ruleName}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">
                        Statutory Reference: {v.statutoryReference}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge status={v.status} size="sm">
                        {v.status}
                      </Badge>
                      {v.status !== "PASS" && (
                        <Badge status={v.severity} size="sm">
                          {v.severity}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Value Comparison Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-slate-500 uppercase tracking-wider font-mono block text-[10px]">
                        Detected On Label
                      </span>
                      <p className="font-semibold text-slate-200">
                        {v.detectedValue || "✕ [Missing from label artwork]"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-slate-500 uppercase tracking-wider font-mono block text-[10px]">
                        Statutory Requirement
                      </span>
                      <p className="font-semibold text-slate-200">
                        {v.expectedRequirement}
                      </p>
                    </div>
                  </div>

                  {/* Legal Explanation & Recommendation */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="text-xs leading-relaxed text-slate-300">
                      <strong className="text-slate-200 font-semibold">Legal Analysis: </strong>
                      {v.legalExplanation}
                    </div>

                    {v.recommendedCorrection && (
                      <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-500/30 text-xs text-blue-200 space-y-1">
                        <span className="font-semibold text-blue-300 flex items-center gap-1 font-mono uppercase text-[10px]">
                          <Scale className="h-3.5 w-3.5" /> Recommended Packaging Amendment:
                        </span>
                        <p className="font-sans leading-relaxed">{v.recommendedCorrection}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
