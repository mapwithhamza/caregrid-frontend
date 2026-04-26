import {
  Activity,
  BarChart3,
  Bot,
  Building2,
  MapPinned,
  Map,
  Search,
  ShieldCheck
} from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Overview", icon: Activity },
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/facilities", label: "Facilities", icon: Building2 },
  { to: "/impact", label: "Impact", icon: Map },
  { to: "/map", label: "GIS Map", icon: MapPinned },
  { to: "/search", label: "Search", icon: Search },
  { to: "/agent", label: "Agent", icon: Bot }
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-72 overflow-hidden border-r border-slate-800 bg-slate-950 px-4 py-6 text-white shadow-2xl lg:sticky lg:block">
      <div className="absolute inset-0 bg-teal-500/10" />
      <div className="relative">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="rounded-2xl bg-teal-400/20 p-2.5 text-teal-200 ring-1 ring-teal-300/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-200">
              CareGrid
            </p>
            <p className="text-xs text-slate-400">India healthcare intelligence</p>
          </div>
        </div>

        <nav className="space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition",
                    isActive
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  ].join(" ")
                }
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold text-white">AI-ready integration</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Frontend calls backend APIs only and is prepared for future AI/vector/web fields.
          </p>
        </div>
      </div>
    </aside>
  );
}
