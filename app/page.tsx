import Link from "next/link";
import {
  ShieldCheck,
  Scale,
  ScanText,
  AlertOctagon,
  FileCheck,
  ArrowRight,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Lock,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function LandingPage() {
  return (
    <div className="space-y-24 py-8">
      {/* Hero Section */}
      <section className="text-center space-y-8 max-w-4xl mx-auto pt-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider font-mono">
          <Sparkles className="h-3.5 w-3.5" />
          <span>India Legal Metrology Packaged Commodities (LMPC 2011) AI Platform</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Automated Packaging Compliance for{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-sky-400 bg-clip-text text-transparent">
              Indian Legal Metrology
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Upload packaging label artwork and instantly audit mandatory declarations, standard metric units, MRP formatting, and consumer care channels against the <strong>Legal Metrology Act, 2009</strong>.
          </p>
        </div>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link href="/analyze/new" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-auto text-base font-bold shadow-xl shadow-blue-500/20">
              <Scale className="h-5 w-5 mr-1" />
              <span>Audit Product Label Now</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-base font-semibold">
              <span>View Audit Dashboard</span>
            </Button>
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Deterministic Rule Engine
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Rule 6, 11, 13 & 18 Codified
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Section 36 Penalty Risk Prevention
          </span>
        </div>
      </section>

      {/* Interactive Flow Stepper */}
      <section className="space-y-10 max-w-5xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            How MetrologyShield Verifies Packaging
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            A high-assurance pipeline combining local OCR, structured AI extraction, and hard-coded statutory verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card variant="glass" className="p-6 border-slate-800 space-y-3 relative">
            <div className="h-10 w-10 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold font-mono text-sm">
              01
            </div>
            <h3 className="text-base font-bold text-white">Upload Artwork</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Accepts PNG, JPG, or WEBP label artwork. Automatically performs grayscale and contrast optimization.
            </p>
          </Card>

          <Card variant="glass" className="p-6 border-slate-800 space-y-3 relative">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold font-mono text-sm">
              02
            </div>
            <h3 className="text-base font-bold text-white">OCR & AI Parsing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tesseract & Vision OCR extract raw text, and AI maps declarations into structured Legal Metrology entities.
            </p>
          </Card>

          <Card variant="glass" className="p-6 border-slate-800 space-y-3 relative">
            <div className="h-10 w-10 rounded-xl bg-sky-600/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold font-mono text-sm">
              03
            </div>
            <h3 className="text-base font-bold text-white">Human Review</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Side-by-side inspection allows auditors to correct any OCR misreads prior to final legal evaluation.
            </p>
          </Card>

          <Card variant="glass" className="p-6 border-slate-800 space-y-3 relative">
            <div className="h-10 w-10 rounded-xl bg-emerald-600/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-mono text-sm">
              04
            </div>
            <h3 className="text-base font-bold text-white">Statutory Report</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deterministic rule evaluation generates overall compliance score, violation citations, and exact packaging amendments.
            </p>
          </Card>
        </div>
      </section>

      {/* Core Capabilities Section */}
      <section className="space-y-12 max-w-6xl mx-auto">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 font-mono">
            Platform Pillars
          </span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Engineered for FMCG, Cosmetics, Food & Retail Packaging
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card variant="glass" className="p-8 border-slate-800 space-y-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Scale className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">
              Deterministic Rules Engine
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unlike generic LLM bots that hallucinate laws, MetrologyShield evaluates declarations through hardcoded statutory logic under the Legal Metrology (Packaged Commodities) Rules, 2011.
            </p>
          </Card>

          <Card variant="glass" className="p-8 border-slate-800 space-y-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ScanText className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">
              Standard Metric Validation (Rule 13)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Detects and flags illegal non-standard unit abbreviations (e.g. &quot;gms&quot;, &quot;cc&quot;, &quot;kilos&quot;, &quot;pkts&quot;) which trigger statutory prosecution under Section 36 of the Act.
            </p>
          </Card>

          <Card variant="glass" className="p-8 border-slate-800 space-y-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertOctagon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">
              MRP & Tax Inclusivity (Rule 6(1)(e))
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Validates that retail pricing declarations explicitly state &quot;inclusive of all taxes&quot; or &quot;incl. of all taxes&quot; and checks for prohibited dual MRP declarations.
            </p>
          </Card>
        </div>
      </section>

      {/* Statutory Rules Preview Banner */}
      <section className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-950 border border-blue-500/30 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300 font-mono">
                Codified Knowledgebase
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Explore the Legal Metrology Rulebook
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Review all 11+ statutory rules, minimum font sizes, penalty structures, and compliant packaging layout examples.
            </p>
          </div>

          <div className="shrink-0">
            <Link href="/rules">
              <Button variant="gold" size="lg" className="font-bold">
                <span>Browse Rulebook</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
