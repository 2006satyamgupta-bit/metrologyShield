"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  PlusCircle,
  History,
  BookOpen,
  LayoutDashboard,
  Cpu,
  User,
  LogOut,
  ChevronDown,
  Info,
} from "lucide-react";
import { useAuth } from "@/lib/auth/authContext";
import { cn } from "@/lib/utils";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/analyze/new", label: "New Analysis", icon: PlusCircle, highlight: true },
    { href: "/history", label: "Audit History", icon: History },
    { href: "/rules", label: "Legal Rulebook", icon: BookOpen },
    { href: "/about", label: "Statutory Info", icon: Info },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-tight text-white text-lg font-sans">
                    Metrology<span className="text-blue-400">Shield</span>
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded">
                    LMPC 2011
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 tracking-wide">
                  Packaged Commodities AI Compliance
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 pl-4">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-slate-800/90 text-blue-400 border border-slate-700 shadow-sm"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white",
                      link.highlight &&
                        !isActive &&
                        "bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-3">
            {/* System Engine Indicator */}
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Cpu className="h-3.5 w-3.5 text-slate-400" />
              <span>OCR & Rule Engine Active</span>
            </div>

            {/* User Profile Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 transition-colors text-left"
                >
                  <div className="h-7 w-7 rounded-md bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-semibold text-xs">
                    {user.fullName?.charAt(0) || "U"}
                  </div>
                  <div className="hidden sm:flex flex-col">
                    <span className="text-xs font-medium text-slate-200 truncate max-w-[120px]">
                      {user.fullName || user.email}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                      {user.organization || "Compliance"}
                    </span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

                {isUserMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseLeave={() => setIsUserMenuOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-800 mb-1">
                      <p className="text-xs font-semibold text-white truncate">
                        {user.fullName || "Analyst"}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <span className="mt-1 inline-block px-1.5 py-0.5 text-[9px] font-semibold uppercase bg-slate-800 text-slate-300 rounded">
                        Role: {user.role || "Auditor"}
                      </span>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      Dashboard
                    </Link>
                    <Link
                      href="/rules"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      Statutory Rulebook
                    </Link>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 rounded-lg mt-1 border-t border-slate-800/80"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
              >
                <User className="h-3.5 w-3.5" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
