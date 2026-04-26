import { Bot, Building2, Database, Map, Search, ShieldCheck, TestTube2 } from "lucide-react";

import { Badge } from "../components/common/Badge";
import { MetricCard } from "../components/common/MetricCard";

const systemCards = [
  {
    title: "Trust scoring",
    description: "Facility reliability signals are converted into stable trust categories for frontend display.",
    icon: ShieldCheck
  },
  {
    title: "Healthcare facility search",
    description: "Search will rank real facilities by matched fields, warning flags, and trust readiness.",
    icon: Search
  },
  {
    title: "Trust desert analysis",
    description: "Impact views will surface priority states and reliability gaps for healthcare planning.",
    icon: Map
  },
  {
    title: "Agent recommendations",
    description: "The agent panel will explain why real facilities match a healthcare need.",
    icon: Bot
  }
];

export function HomePage() {
  return (
    <section className="space-y-8">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
        <div className="bg-slate-950 px-8 py-10 text-white">
          <Badge variant="success">Live API integration active</Badge>
          <h2 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            CareGrid India
        </h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Agentic healthcare trust intelligence for India.
        </p>
          <div className="mt-6 inline-flex rounded-full border border-teal-300/30 bg-teal-400/10 px-4 py-2 text-sm font-medium text-teal-100">
            Search, impact, and agent routes are backend-connected.
          </div>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Facilities"
            value="10,000"
            description="Real CSV-backed healthcare facility records."
            icon={Building2}
          />
          <MetricCard
            title="States/UTs"
            value="34"
            description="Coverage uses the backend's cleaned state field."
            icon={Map}
          />
          <MetricCard
            title="Backend tests"
            value="72"
            description="Backend integration contract is currently passing."
            icon={TestTube2}
          />
          <MetricCard
            title="CSV sources"
            value="11"
            description="Validated backend files powering the API."
            icon={Database}
          />
        </div>
      </div>

      <div>
        <div className="mb-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
            Platform scope
          </p>
          <h3 className="mt-2 text-2xl font-bold text-slate-950">
            What this system does
          </h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {systemCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 inline-flex rounded-2xl bg-teal-50 p-3 text-teal-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="text-lg font-semibold text-slate-950">{card.title}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
