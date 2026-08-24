"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AnalysisWizard } from "@/components/analysis/AnalysisWizard";
import { AnalysisRecord } from "@/types";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function AnalysisDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalysis() {
      if (!id) return;
      try {
        setIsLoading(true);
        const res = await fetch(`/api/analyze/${id}`);
        const data = await res.json();
        if (data.success && data.data) {
          setAnalysis(data.data);
        } else {
          setError(data.error || "Analysis not found.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch analysis details.");
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalysis();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <span className="text-sm text-slate-400 font-medium">
          Loading packaging audit record...
        </span>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Record Not Found</h2>
        <p className="text-xs text-slate-400">
          {error || "The requested packaging compliance analysis could not be found."}
        </p>
        <Link href="/history">
          <Button variant="primary" size="sm">
            Return to Audit History
          </Button>
        </Link>
      </div>
    );
  }

  return <AnalysisWizard initialAnalysis={analysis} />;
}
