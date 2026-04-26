import type { ComponentType } from "react";

interface MetricCardProps {
  title: string;
  value: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
}

export function MetricCard({ title, value, description, icon: Icon }: MetricCardProps) {
  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
        </div>
        {Icon ? (
          <div className="rounded-2xl bg-teal-50 p-3 text-teal-700 ring-1 ring-teal-100">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
      {description ? <p className="mt-4 text-sm leading-6 text-slate-600">{description}</p> : null}
    </div>
  );
}
