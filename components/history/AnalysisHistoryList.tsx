"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  History,
  Trash2,
  ExternalLink,
  ArrowUpDown,
  PlusCircle,
  Scale,
  Calendar,
  AlertOctagon,
  FileCheck,
  Loader2,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth/authContext";
import { AnalysisRecord, ComplianceStatus } from "@/types";
import { formatDate } from "@/lib/utils";
import { PdfAuditGenerator } from "@/lib/utils/pdfGenerator";

export const AnalysisHistoryList: React.FC = () => {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ComplianceStatus | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "score_desc" | "score_asc">("date_desc");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAnalyses = async () => {
    try {
      setIsLoading(true);
      const userId = user?.id || "default-user";
      const params = new URLSearchParams({
        userId,
        status: statusFilter,
        search: searchQuery,
        sortBy,
      });
      const res = await fetch(`/api/analyze?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAnalyses(data.data);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, [user, statusFilter, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnalyses();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this compliance audit record?")) {
      return;
    }

    try {
      setDeletingId(id);
      const userId = user?.id || "default-user";
      const res = await fetch(`/api/analyze/${id}?userId=${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setAnalyses((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-400" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Packaging Audit History & Archives
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Search, filter, and inspect past Legal Metrology compliance inspection records.
          </p>
        </div>

        <Link href="/analyze/new">
          <Button variant="primary" size="md">
            <PlusCircle className="h-4 w-4" />
            <span>Upload New Label</span>
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <Card variant="glass" className="p-4 border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, manufacturer, or analysis ID..."
              className="w-full pl-10 pr-24 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium"
            >
              Search
            </button>
          </form>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="score_desc">Highest Score</option>
              <option value="score_asc">Lowest Score</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-800/80">
          {(["ALL", "COMPLIANT", "PARTIALLY_COMPLIANT", "NON_COMPLIANT", "REQUIRES_REVIEW"] as const).map(
            (st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {st === "ALL" ? "All Analyses" : st.replace("_", " ")}
              </button>
            )
          )}
        </div>
      </Card>

      {/* Analyses Table List */}
      <Card variant="glass" className="p-0 border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="min-h-[300px] flex items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
            <span className="text-xs text-slate-400 font-medium">
              Loading compliance archives...
            </span>
          </div>
        ) : analyses.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Scale className="h-10 w-10 text-slate-600 mx-auto" />
            <h4 className="text-sm font-semibold text-white">No analysis records found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No previous audit records match your search or filter parameters.
            </p>
            <Link href="/analyze/new">
              <Button variant="primary" size="sm">
                <PlusCircle className="h-4 w-4" />
                <span>Upload New Label</span>
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-mono">
                <tr>
                  <th className="py-3.5 px-4">Product / SKU Name</th>
                  <th className="py-3.5 px-4">Compliance Status</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Violations</th>
                  <th className="py-3.5 px-4">Date Audited</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {analyses.map((a) => {
                  const violationsCount = a.complianceResult?.failedRulesCount ?? 0;
                  return (
                    <tr
                      key={a.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-4 px-4 font-semibold text-white">
                        <Link
                          href={`/analyze/${a.id}`}
                          className="hover:text-blue-400 transition-colors block"
                        >
                          <span className="text-sm font-bold text-white block">
                            {a.productName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ID: {a.id}
                          </span>
                        </Link>
                      </td>
                      <td className="py-4 px-4">
                        <Badge status={a.complianceStatus || a.status} size="sm">
                          {a.complianceStatus || a.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-slate-200">
                        {a.complianceScore !== null ? `${a.complianceScore}%` : "—"}
                      </td>
                      <td className="py-4 px-4">
                        {violationsCount > 0 ? (
                          <span className="text-rose-400 font-semibold flex items-center gap-1">
                            <AlertOctagon className="h-3.5 w-3.5" />
                            {violationsCount} breaches
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <FileCheck className="h-3.5 w-3.5" />
                            0 breaches
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-400">
                        {formatDate(a.createdAt)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                PdfAuditGenerator.generateAndDownloadPdf(a);
                              } catch (err) {
                                console.error("PDF download failed:", err);
                              }
                            }}
                            className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 transition-colors border border-amber-500/30 flex items-center gap-1 text-[11px] font-semibold px-2"
                            title="Download Official PDF Certificate to Device"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>PDF</span>
                          </button>
                          <Link href={`/analyze/${a.id}`}>
                            <Button variant="secondary" size="sm" className="text-xs">
                              <span>Report</span>
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(a.id, e)}
                            disabled={deletingId === a.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                            title="Delete record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
