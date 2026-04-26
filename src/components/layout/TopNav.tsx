import { useEffect, useState } from "react";
import { Activity, BarChart3, Bot, Building2, Map, MapPinned, Search, ShieldCheck } from "lucide-react";
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

export function TopNav() {
  const [isBackendReady, setIsBackendReady] = useState<boolean>(true);
  const location = useLocation();

  useEffect(() => {
    let isDisposed = false;

    async function checkHealth() {
      try {
        await getHealth();
        if (!isDisposed) {
          setIsBackendReady(true);
        }
      } catch {
        if (!isDisposed) {
          setIsBackendReady(false);
        }
      }
    }

    void checkHealth();
    const timer = window.setInterval(() => {
      void checkHealth();
    }, 15000);

    return () => {
      isDisposed = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-2 text-teal-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-slate-950">CareGrid India</p>
              <p className="text-xs text-slate-500">AI-ready healthcare trust intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              Local
            </span>
            <span
              className={[
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                isBackendReady
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              ].join(" ")}
            >
              <span
                className={[
                  "h-2 w-2 rounded-full",
                  isBackendReady ? "bg-emerald-500" : "bg-red-500"
                ].join(" ")}
              />
              {isBackendReady ? "Backend ready" : "Backend offline"}
            </span>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  {
                    const isAgentDefault = link.to === "/agent" && location.pathname === "/";
                    const isCurrent = isActive || isAgentDefault;
                    return [
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition",
                      isCurrent
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    ].join(" ");
                  }
                }
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