import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "interactive" | "highlight";
}

export const Card: React.FC<CardProps> = ({
  className,
  children,
  variant = "default",
  ...props
}) => {
  const variantStyles = {
    default: "bg-slate-900/90 border border-slate-800 text-slate-100 shadow-xl",
    glass:
      "bg-slate-900/60 backdrop-blur-xl border border-slate-700/60 text-slate-100 shadow-2xl",
    interactive:
      "bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-blue-500/5",
    highlight:
      "bg-gradient-to-b from-slate-900 to-slate-950 border border-blue-500/30 text-slate-100 shadow-xl shadow-blue-500/5",
  };

  return (
    <div
      className={cn(
        "rounded-xl p-6 transition-all duration-150 relative overflow-hidden",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
