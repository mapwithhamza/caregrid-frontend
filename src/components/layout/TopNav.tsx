import { useEffect, useState } from "react";
import { Activity, BarChart3, Bot, Building2, Map, MapPinned, Moon, Search, ShieldCheck, Sun } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import { getHealth } from "../../api/caregridApi";

const links = [
  { to: "/overview", label: "Overview", icon: Activity },
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/facilities", label: "Facilities", icon: Building2 },
  { to: "/impact", label: "Impact", icon: Map },
  { to: "/map", label: "GIS Map", icon: MapPinned },
  { to: "/search", label: "Search", icon: Search },
  { to: "/agent", label: "Agent", icon: Bot }
];

function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return (
      localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return [isDark, () => setIsDark((d) => !d)] as const;
}

export function TopNav() {
  const [isBackendReady, setIsBackendReady] = useState<boolean>(true);
  const [isDark, toggleDark] = useDarkMode();
  const location = useLocation();

  useEffect(() => {
    let isDisposed = false;

    async function checkHealth() {
      try {
        await getHealth();
        if (!isDisposed) setIsBackendReady(true);
      } catch {
        if (!isDisposed) setIsBackendReady(false);
      }
    }

    void checkHealth();
    const timer = window.setInterval(() => void checkHealth(), 15000);

    return () => {
      isDisposed = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/95">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="rounded-2xl bg-slate-950 p-2 text-teal-300 ring-2 ring-transparent transition group-hover:ring-teal-500/30 dark:bg-slate-800">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-slate-950 dark:text-slate-50">
                CareGrid India
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI-ready healthcare trust intelligence
              </p>
            </div>
          </NavLink>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Environment badge */}
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              Local
            </span>

            {/* Backend status */}
            <span
              className={[
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                isBackendReady
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-400"
              ].join(" ")}
            >
              <span
                className={[
                  "h-2 w-2 rounded-full animate-pulse-dot",
                  isBackendReady ? "bg-emerald-500" : "bg-red-500"
                ].join(" ")}
              />
              {isBackendReady ? "Backend ready" : "Backend offline"}
            </span>

            {/* Dark mode toggle */}
            <button
              type="button"
              onClick={toggleDark}
              id="dark-mode-toggle"
              aria-label="Toggle dark mode"
              className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-wrap gap-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => {
                  const isAgentDefault = link.to === "/agent" && location.pathname === "/";
                  const isCurrent = isActive || isAgentDefault;
                  return [
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-all",
                    isCurrent
                      ? "border-slate-900 bg-slate-900 text-white shadow-sm dark:border-teal-500 dark:bg-teal-500/20 dark:text-teal-300"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  ].join(" ");
                }}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}