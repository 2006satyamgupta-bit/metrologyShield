import React from "react";
import Link from "next/link";
import { ShieldAlert, Scale, ExternalLink } from "lucide-react";
import { STATUTORY_LEGAL_DISCLAIMER } from "@/lib/constants/legalRules";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950 text-slate-400 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Statutory Legal Disclaimer Callout */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4 mb-8">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider font-mono">
                Statutory Compliance Assistance Notice (Legal Metrology Act, 2009)
              </h4>
              <p className="text-xs leading-relaxed text-slate-300">
                {STATUTORY_LEGAL_DISCLAIMER}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-900">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-blue-400" />
              <span className="font-bold text-white tracking-wide">
                MetrologyShield
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Enterprise packaging compliance auditing engine for Indian Legal Metrology (Packaged Commodities) Rules, 2011. Built with multi-layered deterministic statutory validation, OCR extraction, and AI assistance.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
              Statutory References
            </h5>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                <Link href="/rules" className="hover:text-blue-400 transition-colors">
                  Rule 6: Mandatory Declarations
                </Link>
              </li>
              <li>
                <Link href="/rules" className="hover:text-blue-400 transition-colors">
                  Rule 13: Standard Metric Units
                </Link>
              </li>
              <li>
                <Link href="/rules" className="hover:text-blue-400 transition-colors">
                  Rule 18: Prohibition of Dual MRP
                </Link>
              </li>
              <li>
                <Link href="/rules" className="hover:text-blue-400 transition-colors">
                  Sec 36: Penalties & Offenses
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
              Platform
            </h5>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                <Link href="/dashboard" className="hover:text-blue-400 transition-colors">
                  Audit Dashboard
                </Link>
              </li>
              <li>
                <Link href="/analyze/new" className="hover:text-blue-400 transition-colors">
                  Upload Package Artwork
                </Link>
              </li>
              <li>
                <Link href="/history" className="hover:text-blue-400 transition-colors">
                  Compliance Archive
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-blue-400 transition-colors">
                  Documentation & FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} MetrologyShield. All Rights Reserved. Indian Legal Metrology Packaging Standards.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              Deterministic Engine v2.4
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
