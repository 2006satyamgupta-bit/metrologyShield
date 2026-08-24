import React from "react";
import { cn } from "@/lib/utils";
import { ComplianceStatus, FieldStatus, ViolationSeverity } from "@/types";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "neutral"
    | "outline";
  status?: ComplianceStatus | FieldStatus | ViolationSeverity | string;
  size?: "sm" | "md" | "lg";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant,
  status,
  size = "md",
  ...props
}) => {
  let resolvedVariant = variant || "default";

  if (status) {
    switch (status) {
      case "COMPLIANT":
      case "PASS":
      case "DETECTED":
        resolvedVariant = "success";
        break;
      case "PARTIALLY_COMPLIANT":
      case "REQUIRES_REVIEW":
      case "REVIEW":
      case "WARNING":
      case "UNCERTAIN":
      case "MEDIUM":
        resolvedVariant = "warning";
        break;
      case "NON_COMPLIANT":
      case "VIOLATION":
      case "CRITICAL":
      case "HIGH":
      case "FAILED":
      case "MISSING":
        resolvedVariant = "danger";
        break;
      case "LOW":
      case "INFO":
        resolvedVariant = "info";
        break;
      case "NOT_APPLICABLE":
      case "NOT APPLICABLE":
      case "EXEMPT":
        resolvedVariant = "neutral";
        break;
      default:
        resolvedVariant = "neutral";
    }
  }

  const variantStyles = {
    default: "bg-slate-800 text-slate-200 border-slate-700",
    success: "bg-emerald-950/80 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/20",
    warning: "bg-amber-950/80 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/20",
    danger: "bg-rose-950/80 text-rose-300 border-rose-500/40 ring-1 ring-rose-500/20",
    info: "bg-sky-950/80 text-sky-300 border-sky-500/40 ring-1 ring-sky-500/20",
    neutral: "bg-slate-800/80 text-slate-400 border-slate-700",
    outline: "bg-transparent text-slate-300 border-slate-600",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs font-semibold",
    lg: "px-3 py-1.5 text-sm font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border tracking-wide uppercase font-mono transition-colors",
        variantStyles[resolvedVariant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children || status}
    </span>
  );
};
