interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = "Loading CareGrid data..." }: LoadingStateProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-3 w-3 animate-pulse rounded-full bg-teal-500" />
        <p className="text-sm font-medium text-slate-600">{label}</p>
      </div>
    </div>
  );
}
