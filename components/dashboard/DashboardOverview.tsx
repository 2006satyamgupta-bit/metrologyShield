"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  FileCheck,
  PlusCircle,
  TrendingUp,
  History,
  ArrowRight,
  ExternalLink,
  Scale,
  Sparkles,
  BarChart3,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth/authContext";
import { AnalysisRecord, DashboardStats } from "@/types";
import { formatDate } from "@/lib/utils";

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const userId = user?.id || "default-user";
        const res = await fetch(`/api/dashboard/stats?userId=${userId}`);
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <span className="text-sm text-slate-400 font-medium">
          Loading Legal Metrology audit dashboard...
        </span>
      </div>
    );
  }

  const total = stats?.totalAnalyses || 0;
  const compliant = stats?.compliantCount || 0;
  const nonCompliant = stats?.nonCompliantCount || 0;
  const requiresReview = (stats?.requiresReviewCount || 0) + (stats?.partiallyCompliantCount || 0);
  const avgScore = stats?.averageScore || 0;
  const recentAnalyses = stats?.recentAnalyses || [];
  const topViolations = stats?.topViolations || [];

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              Regulatory Affairs Cockpit
            </span>
            <span className="text-xs text-slate-400">
              Legal Metrology Act, 2009 Standards
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Packaging Compliance & Audit Center
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Real-time inspection of consumer packaged commodities against statutory declarations, net quantity standards, MRP formatting, and mandatory grievance channels under LMPC Rules, 2011.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link href="/analyze/new">
            <Button variant="primary" size="lg" className="shadow-lg shadow-blue-500/20 font-bold">
              <PlusCircle className="h-5 w-5" />
              <span>Scan New Label</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card variant="glass" className="p-6 border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Total Labels Audited
            </span>
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Scale className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white font-mono">{total}</span>
            <span className="text-xs text-slate-500 font-medium">All Skus</span>
          </div>
        </Card>

        <Card variant="glass" className="p-6 border-emerald-500/20 bg-emerald-950/10 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
              Compliant Labels
            </span>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-emerald-300 font-mono">
              {compliant}
            </span>
            <span className="text-xs text-emerald-400/80 font-medium">
              {total > 0 ? Math.round((compliant / total) * 100) : 0}% Pass Rate
            </span>
          </div>
        </Card>

        <Card variant="glass" className="p-6 border-rose-500/20 bg-rose-950/10 hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider font-mono">
              Critical Violations
            </span>
            <div className="h-9 w-9 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertOctagon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-rose-300 font-mono">
              {nonCompliant}
            </span>
            <span className="text-xs text-rose-400/80 font-medium">
              Sec 36 Risk
            </span>
          </div>
        </Card>

        <Card variant="glass" className="p-6 border-amber-500/20 bg-amber-950/10 hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider font-mono">
              Avg. Compliance Rating
            </span>
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-amber-300 font-mono">
              {avgScore}%
            </span>
            <span className="text-xs text-amber-400/80 font-medium">
              Conformity Index
            </span>
          </div>
        </Card>
      </div>

      {/* Main Grid: Recent Analyses & Top Violations Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Analyses Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-400" />
              <h3 className="text-lg font-bold text-white tracking-tight">
                Recent Packaging Audits
              </h3>
            </div>
            <Link
              href="/history"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
            >
              <span>View All History</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <Card variant="glass" className="p-0 border-slate-800 overflow-hidden">
            {recentAnalyses.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Scale className="h-10 w-10 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-400 font-medium">
                  No package labels analyzed yet.
                </p>
                <Link href="/analyze/new">
                  <Button variant="primary" size="sm">
                    <PlusCircle className="h-4 w-4" />
                    <span>Upload First Label Artwork</span>
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-mono">
                    <tr>
                      <th className="py-3 px-4">Product / SKU</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4">Violations</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {recentAnalyses.map((analysis) => {
                      const violationsCount =
                        analysis.complianceResult?.failedRulesCount ?? 0;
                      return (
                        <tr
                          key={analysis.id}
                          className="hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-semibold text-white">
                            <div className="flex flex-col">
                              <span className="truncate max-w-[200px]">
                                {analysis.productName}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                ID: {analysis.id.slice(0, 8)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge
                              status={analysis.complianceStatus || analysis.status}
                              size="sm"
                            >
                              {analysis.complianceStatus || analysis.status}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                            {analysis.complianceScore !== null
                              ? `${analysis.complianceScore}%`
                              : "—"}
                          </td>
                          <td className="py-3.5 px-4">
                            {violationsCount > 0 ? (
                              <span className="text-rose-400 font-semibold">
                                {violationsCount} breaches
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-semibold">
                                0 breaches
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">
                            {formatDate(analysis.createdAt)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link href={`/analyze/${analysis.id}`}>
                              <Button variant="ghost" size="sm" className="text-xs">
                                <span>Report</span>
                                <ArrowRight className="h-3 w-3" />
                              </Button>
                            </Link>
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

        {/* Top Statutory Violations Chart/Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">
              Top Statutory Breaches
            </h3>
          </div>

          <Card variant="glass" className="p-6 border-slate-800 space-y-4">
            {topViolations.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No recurring statutory violations recorded yet.
              </div>
            ) : (
              <div className="space-y-4">
                {topViolations.map((v) => (
                  <div key={v.ruleCode} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-blue-400 font-bold">
                        {v.ruleCode}
                      </span>
                      <span className="text-rose-400 font-mono font-bold">
                        {v.count} violations
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 truncate">
                      {v.name}
                    </p>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-rose-500 h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(100, (v.count / (total || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-slate-800">
              <Link href="/rules">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  <span>Explore LMPC Statutory Rulebook</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
