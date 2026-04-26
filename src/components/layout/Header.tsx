import { HeartPulse } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-4 py-4 shadow-sm backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-950 p-2.5 text-teal-300 shadow-lg shadow-slate-900/10">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-950">
              CareGrid India
            </h1>
            <p className="text-sm font-medium text-slate-500">Healthcare Trust Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 sm:inline-flex">
            Local
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Backend ready
          </span>
        </div>
      </div>
    </header>
  );
}
