import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

import { TopNav } from "./TopNav";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="flex min-h-screen min-w-0 flex-col">
        <TopNav />

        <main className="mx-auto flex w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="w-full">{children}</div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 bg-white/60 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/60">
          <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <div className="rounded-xl bg-slate-950 p-1.5 text-teal-300 dark:bg-slate-800">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">CareGrid India</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span>AI-ready healthcare trust intelligence</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
              <span>10,000 facilities • 34 states/UTs • CSV-backed</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                v1.0.0
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
