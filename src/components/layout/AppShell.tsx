import type { ReactNode } from "react";

import { TopNav } from "./TopNav";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="flex min-h-screen min-w-0 flex-col">
        <TopNav />
        <main className="mx-auto flex w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
