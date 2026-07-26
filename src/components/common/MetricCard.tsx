import type { ComponentType } from "react";

type ColorVariant = "teal" | "sky" | "violet" | "emerald" | "amber" | "red";

interface MetricCardProps {
  title: string;
  value: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  color?: ColorVariant;
  trend?: { label: string; positive: boolean };
}

const colorMap: Record<ColorVariant, { icon: string; bg: string; ring: string }> = {
  teal:    { icon: "text-teal-700",    bg: "bg-teal-50",    ring: "ring-teal-100" },
  sky:     { icon: "text-sky-700",     bg: "bg-sky-50",     ring: "ring-sky-100" },
  violet:  { icon: "text-violet-700",  bg: "bg-violet-50",  ring: "ring-violet-100" },
  emerald: { icon: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-100" },
  amber:   { icon: "text-amber-700",   bg: "bg-amber-50",   ring: "ring-amber-100" },
  red:     { icon: "text-red-700",     bg: "bg-red-50",     ring: "ring-red-100" }
};

export function MetricCard({ title, value, description, icon: Icon, color = "teal", trend }: MetricCardProps) {
  const colors = colorMap[color];
  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm card-lift dark:bg-slate-800 dark:border-slate-700">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
            {value}
          </p>
          {trend ? (
            <span
              className={[
                "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                trend.positive
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
              ].join(" ")}
            >
              {trend.positive ? "↑" : "↓"} {trend.label}
            </span>
          ) : null}
        </div>
        {Icon ? (
          <div className={["flex-shrink-0 rounded-2xl p-3 ring-1", colors.icon, colors.bg, colors.ring].join(" ")}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
      {description ? (
        <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
      ) : null}
    </div>
  );
}
