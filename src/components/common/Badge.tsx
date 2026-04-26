import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

const variantClasses = {
  default: "border-slate-200 bg-slate-100 text-slate-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  info: "border-sky-200 bg-sky-50 text-sky-700"
};

export function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
