"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, User, Building, Mail, ArrowRight, Lock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/authContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const res = await signUp(email, fullName, organization);
        if (!res.success) {
          setError(res.error || "Failed to create account");
          return;
        }
      } else {
        const res = await signIn(email, password);
        if (!res.success) {
          setError(res.error || "Failed to sign in");
          return;
        }
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (role: "auditor" | "analyst") => {
    setIsLoading(true);
    if (role === "auditor") {
      await signIn("auditor.lead@apexregulatory.in");
    } else {
      await signIn("packaging.specialist@fmcgcorp.in");
    }
    setIsLoading(false);
    router.push("/dashboard");
  };

  return (
    <div className="max-w-md mx-auto my-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl shadow-blue-500/20 mx-auto">
          <ShieldCheck className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          {isSignUp ? "Create Auditor Profile" : "Sign In to MetrologyShield"}
        </h1>
        <p className="text-xs text-slate-400">
          Legal Metrology compliance and label inspection portal
        </p>
      </div>

      <Card variant="glass" className="p-8 border-slate-800 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase font-mono">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase font-mono">
                  Organization / FMCG Brand
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Apex Consumer Products Ltd."
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase font-mono">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="compliance@yourcompany.com"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase font-mono">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="w-full font-bold"
          >
            <span>{isSignUp ? "Register Auditor Account" : "Sign In to Workspace"}</span>
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </form>

        {/* Quick Demo Switcher */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-mono block text-center">
            Or 1-Click Instant Auditor Demo
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo("auditor")}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              Demo: Lead Auditor
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("analyst")}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              Demo: Packaging Specialist
            </button>
          </div>
        </div>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
          >
            {isSignUp
              ? "Already have an account? Sign In"
              : "Need an enterprise account? Create Profile"}
          </button>
        </div>
      </Card>
    </div>
  );
}
