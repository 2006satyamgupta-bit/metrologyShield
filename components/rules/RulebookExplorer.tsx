"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Scale,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { STATUTORY_COMPLIANCE_RULES } from "@/lib/constants/legalRules";

export const RulebookExplorer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const categories = [
    "ALL",
    "MANUFACTURER",
    "QUANTITY",
    "PRICING",
    "IDENTITY",
    "DATES",
    "CONSUMER_CARE",
    "DISPLAY",
  ];

  const filteredRules = STATUTORY_COMPLIANCE_RULES.filter((rule) => {
    const matchesCategory =
      selectedCategory === "ALL" || rule.category === selectedCategory;
    const matchesSearch =
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.ruleCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.legalReference.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              Statutory Knowledgebase
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Indian Legal Metrology Statutory Rulebook
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Statutory codified requirements under the Legal Metrology Act, 2009 and Legal Metrology (Packaged Commodities) Rules, 2011 (as amended).
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card variant="glass" className="p-4 border-slate-800 space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rules by section, rule code, keyword, or declaration type..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {cat === "ALL" ? "All Categories" : cat.replace("_", " ")}
            </button>
          ))}
        </div>
      </Card>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredRules.map((rule) => (
          <Card
            key={rule.ruleId}
            variant="glass"
            className="p-6 border-slate-800 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                    {rule.ruleCode}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">
                    {rule.name}
                  </h3>
                </div>
                <Badge status={rule.severity} size="sm">
                  {rule.severity}
                </Badge>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono block">
                  Statutory Reference
                </span>
                <p className="text-xs font-semibold text-slate-200 mt-0.5">
                  {rule.legalReference}
                </p>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {rule.description}
              </p>
            </div>

            {/* Penalty Callout */}
            {rule.statutoryMaxPenalty && (
              <div className="pt-3 border-t border-slate-800/80">
                <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                  <div>
                    <strong className="block text-[10px] uppercase font-mono text-rose-400">
                      Statutory Penalty Provision (Sec. 36)
                    </strong>
                    <span className="text-[11px] leading-tight block mt-0.5">
                      {rule.statutoryMaxPenalty}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
