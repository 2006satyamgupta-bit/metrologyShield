import React from "react";
import { Scale, ShieldAlert, BookOpen, ExternalLink, FileText, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { STATUTORY_LEGAL_DISCLAIMER } from "@/lib/constants/legalRules";

export const metadata = {
  title: "Statutory Info & Legal Guidance — MetrologyShield",
  description: "Statutory context and regulatory framework for Indian Legal Metrology compliance.",
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold uppercase tracking-wider font-mono">
          <Scale className="h-3.5 w-3.5" />
          <span>Statutory Regulatory Framework</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Legal Metrology Act, 2009 & Packaged Commodities Rules, 2011
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Overview of mandatory packaging laws, statutory enforcement powers of state Legal Metrology inspectors, and penalty risks.
        </p>
      </div>

      {/* Legal Notice Card */}
      <Card variant="glass" className="p-6 border-amber-500/30 bg-amber-950/10 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm font-mono uppercase tracking-wider">
          <ShieldAlert className="h-5 w-5" />
          <span>Statutory Compliance Assistance Notice</span>
        </div>
        <p className="text-xs leading-relaxed text-slate-300">
          {STATUTORY_LEGAL_DISCLAIMER}
        </p>
      </Card>

      {/* Key Statutory Acts Breakdown */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-400" />
          <span>Statutory Foundations</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="glass" className="p-6 border-slate-800 space-y-3">
            <h3 className="text-base font-bold text-white">
              Legal Metrology Act, 2009
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Enacted to establish and enforce standards of weights and measures, regulate trade and commerce in weights, measures and other goods which are sold or distributed by weight, measure or number.
            </p>
            <ul className="text-xs text-slate-400 space-y-1.5 pt-2 border-t border-slate-800">
              <li>• Section 18: Mandatory adherence to standard packages.</li>
              <li>• Section 36: Fines starting from ₹25,000 up to ₹1,00,000 or 1-year imprisonment for repeat offenses.</li>
            </ul>
          </Card>

          <Card variant="glass" className="p-6 border-slate-800 space-y-3">
            <h3 className="text-base font-bold text-white">
              LMPC Rules, 2011 (As Amended)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Governs all pre-packaged commodities manufactured, packed, imported, or sold in India.
            </p>
            <ul className="text-xs text-slate-400 space-y-1.5 pt-2 border-t border-slate-800">
              <li>• Rule 6: Mandatory declarations on every package.</li>
              <li>• Rule 13: Strict prohibition on non-standard unit symbols (e.g. &quot;gms&quot;).</li>
              <li>• Rule 18: Prohibition on altering MRP or dual pricing.</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Mandatory Declarations Checklist */}
      <Card variant="glass" className="p-8 border-slate-800 space-y-6">
        <h3 className="text-lg font-bold text-white">
          Rule 6 Mandatory Declarations Checklist for Every Package
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-mono">1. Manufacturer / Packer Details</strong>
              <span className="text-slate-400">Complete name and physical address with postal PIN code.</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-mono">2. Generic / Common Name</strong>
              <span className="text-slate-400">Unambiguous generic description of the commodity.</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-mono">3. Net Quantity in SI Units</strong>
              <span className="text-slate-400">Standard symbols (g, kg, ml, L, N). No &quot;gms&quot; or &quot;cc&quot;.</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-mono">4. MRP with All Taxes</strong>
              <span className="text-slate-400">Explicit &quot;inclusive of all taxes&quot; or &quot;incl. of all taxes&quot;.</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-mono">5. Month & Year of Mfg/Packing</strong>
              <span className="text-slate-400">MM/YYYY or Month Year format prominently printed.</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-mono">6. Consumer Care Channel</strong>
              <span className="text-slate-400">Grievance officer, telephone helpline, and email ID.</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
