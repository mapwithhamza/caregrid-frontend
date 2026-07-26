import { useEffect, useRef, useState } from "react";
import { Bot, Building2, Database, Map, Search, ShieldCheck, TestTube2, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "../components/common/Badge";

// ── Animated counter hook ─────────────────────────────────────
function useAnimatedCount(target: number, duration = 1600, start = 0): number {
  const [count, setCount] = useState(start);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // cubic ease-out

    function tick(timestamp: number) {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.round(start + (target - start) * ease(progress)));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, start]);

  return count;
}

// ── Metric stat card with animated count ─────────────────────
interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  description: string;
  icon: React.ElementType;
  colorClass: string;
  delay?: number;
}

function StatCard({ label, value, suffix = "", description, icon: Icon, colorClass, delay = 0 }: StatCardProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const displayCount = useAnimatedCount(visible ? value : 0, 1600, 0);

  return (
    <div
      ref={ref}
      className="animate-fade-in-up opacity-0 group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm card-lift dark:bg-slate-800 dark:border-slate-700"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className={["mb-4 inline-flex rounded-2xl p-3", colorClass].join(" ")}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
        {displayCount.toLocaleString("en-IN")}{suffix}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}

// ── Feature cards ─────────────────────────────────────────────
const featureCards = [
  {
    title: "Trust scoring",
    description: "Facility reliability signals converted into stable trust categories — High Trust, Moderate, Low, or High Risk.",
    icon: ShieldCheck,
    colorClass: "bg-emerald-50 text-emerald-700"
  },
  {
    title: "Facility search",
    description: "Real facilities ranked by matched fields, warning flags, and recommendation readiness.",
    icon: Search,
    colorClass: "bg-sky-50 text-sky-700"
  },
  {
    title: "Trust desert analysis",
    description: "Impact views surface priority states and reliability gaps for healthcare planning teams.",
    icon: Map,
    colorClass: "bg-violet-50 text-violet-700"
  },
  {
    title: "Agent recommendations",
    description: "AI agent explains why real facilities match a healthcare need — with evidence and validation.",
    icon: Bot,
    colorClass: "bg-teal-50 text-teal-700"
  }
];

const stats: StatCardProps[] = [
  { label: "Facilities", value: 10000, description: "Real CSV-backed healthcare records.", icon: Building2, colorClass: "bg-teal-50 text-teal-700" },
  { label: "States / UTs", value: 34, description: "Coverage across India's cleaned state fields.", icon: Map, colorClass: "bg-sky-50 text-sky-700" },
  { label: "Backend tests", value: 72, description: "Integration tests currently passing.", icon: TestTube2, colorClass: "bg-violet-50 text-violet-700" },
  { label: "CSV sources", value: 11, description: "Validated backend files powering the API.", icon: Database, colorClass: "bg-amber-50 text-amber-700" }
];

export function HomePage() {
  return (
    <section className="space-y-12">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-800 shadow-2xl">
        {/* Animated gradient background */}
        <div
          className="absolute inset-0 animate-gradient"
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #134e4a 30%, #1e1b4b 60%, #0f172a 100%)",
            backgroundSize: "200% 200%"
          }}
        />
        {/* Glow orbs */}
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="absolute -bottom-16 right-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative px-8 py-14 text-white sm:px-12">
          <div className="animate-fade-in-up opacity-0" style={{ animationFillMode: "forwards" }}>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">Live API integration active</Badge>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-xs font-semibold text-teal-200">
                <Sparkles className="h-3.5 w-3.5" />
                AI-powered trust intelligence
              </span>
            </div>
          </div>

          <h2
            className="animate-fade-in-up opacity-0 mt-6 max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl"
            style={{ animationDelay: "100ms", animationFillMode: "forwards" }}
          >
            CareGrid{" "}
            <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
              India
            </span>
          </h2>

          <p
            className="animate-fade-in-up opacity-0 mt-4 max-w-2xl text-lg leading-8 text-slate-300"
            style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
          >
            Agentic healthcare trust intelligence for India. Discover, verify, and compare facilities
            across 34 states — backed by 10,000 real records and AI-powered recommendations.
          </p>

          <div
            className="animate-fade-in-up opacity-0 mt-8 flex flex-wrap gap-4"
            style={{ animationDelay: "300ms", animationFillMode: "forwards" }}
          >
            <Link
              to="/agent"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-teal-400 transition-all hover:shadow-teal-500/30 hover:shadow-xl"
            >
              <Bot className="h-4 w-4" />
              Try AI Agent
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/20 transition"
            >
              View Dashboard
            </Link>
          </div>

          <div
            className="animate-fade-in-up opacity-0 mt-8 inline-flex rounded-full border border-teal-300/30 bg-teal-400/10 px-4 py-2 text-sm font-medium text-teal-100"
            style={{ animationDelay: "400ms", animationFillMode: "forwards" }}
          >
            Search, impact, and agent routes are backend-connected.
          </div>
        </div>
      </div>

      {/* ── Animated Stats ───────────────────────────────────── */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400">
          By the numbers
        </p>
        <h3 className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50">Platform at a glance</h3>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, i) => (
            <StatCard key={stat.label} {...stat} delay={i * 80} />
          ))}
        </div>
      </div>

      {/* ── Feature Cards ────────────────────────────────────── */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400">
          Platform scope
        </p>
        <h3 className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50">What this system does</h3>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="animate-fade-in-up opacity-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm card-lift dark:bg-slate-800 dark:border-slate-700"
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: "forwards" }}
              >
                <div className={["mb-4 inline-flex rounded-2xl p-3", card.colorClass].join(" ")}>
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{card.title}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{card.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
