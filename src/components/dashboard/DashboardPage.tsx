import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Flag,
  MapPinned,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import {
  getFacilityTypeSummaries,
  getPriorityStates,
  getReadinessDistribution,
  getStatsOverview,
  getTrustDistribution,
  getTrustGapSummary
} from "../../api/caregridApi";
import type {
  DashboardOverview,
  FacilityTypeSummaryItem,
  PriorityStateItem,
  ReadinessDistributionItem,
  TrustDistributionItem,
  TrustGapSummary
} from "../../api/types";
import { Badge } from "../common/Badge";
import { ErrorState } from "../common/ErrorState";
import { LoadingState } from "../common/LoadingState";
import { MetricCard } from "../common/MetricCard";

interface DashboardData {
  overview: DashboardOverview;
  trustDistribution: TrustDistributionItem[];
  readinessDistribution: ReadinessDistributionItem[];
  facilityTypes: FacilityTypeSummaryItem[];
  trustGapSummary: TrustGapSummary;
  priorityStates: PriorityStateItem[];
}

const trustColors = ["#059669", "#0ea5e9", "#f59e0b", "#dc2626"];
const readinessColors = ["#10b981", "#f59e0b", "#ef4444"];

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-IN").format(value);
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${value.toFixed(1)}%`;
}

function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return value.toFixed(1);
}

export function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [
        overview,
        trustDistribution,
        readinessDistribution,
        facilityTypes,
        trustGapSummary,
        priorityStates
      ] = await Promise.all([
        getStatsOverview(),
        getTrustDistribution(),
        getReadinessDistribution(),
        getFacilityTypeSummaries(),
        getTrustGapSummary(),
        getPriorityStates({ limit: 5 })
      ]);

      setDashboardData({
        overview,
        trustDistribution,
        readinessDistribution,
        facilityTypes,
        trustGapSummary,
        priorityStates
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load the CareGrid dashboard data."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (isLoading) {
    return <LoadingState label="Loading live CareGrid dashboard data..." />;
  }

  if (errorMessage || !dashboardData) {
    return (
      <ErrorState
        title="Dashboard data unavailable"
        message={errorMessage ?? "The dashboard response was empty."}
        onRetry={loadDashboard}
      />
    );
  }

  const {
    overview,
    trustDistribution,
    readinessDistribution,
    facilityTypes,
    trustGapSummary,
    priorityStates
  } = dashboardData;

  return (
    <section className="space-y-8">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success">Live API</Badge>
            <Badge variant="info">CSV-backed</Badge>
            <Badge variant="default">Trust scoring active</Badge>
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            CareGrid Intelligence Dashboard
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Live healthcare trust, readiness, and verification intelligence from
            10,000 Indian facility records.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="Total facilities"
          value={formatNumber(overview.total_facilities)}
          description="Facility records served by the backend."
          icon={Building2}
        />
        <MetricCard
          title="States/UTs covered"
          value={formatNumber(overview.states_covered)}
          description="Cleaned state coverage in the dataset."
          icon={MapPinned}
        />
        <MetricCard
          title="Average trust score"
          value={formatScore(overview.average_trust_score)}
          description="National average across all facilities."
          icon={TrendingUp}
        />
        <MetricCard
          title="Ready for recommendation"
          value={formatNumber(overview.ready_for_recommendation_count)}
          description="Facilities ready for recommendation."
          icon={CheckCircle2}
        />
        <MetricCard
          title="Do not recommend"
          value={formatNumber(trustGapSummary.do_not_recommend_without_review)}
          description="Require human review before use."
          icon={AlertTriangle}
        />
        <MetricCard
          title="Contradiction flags"
          value={formatNumber(trustGapSummary.facilities_with_contradiction_flags)}
          description="Facilities with verification warning signals."
          icon={Flag}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 p-6 text-white">
          <Badge variant="success">Judge-facing insight</Badge>
          <h3 className="mt-4 text-2xl font-bold tracking-tight">National trust gap</h3>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
            {trustGapSummary.headline_insight ?? "No headline insight available."}
          </p>
        </div>
        <div className="grid gap-4 p-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Planning interpretation
            </h4>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {trustGapSummary.planning_interpretation ??
                "No planning interpretation available."}
            </p>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tier 1 priority states
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {trustGapSummary.tier1_priority_states ?? "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tier 2 priority states
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {trustGapSummary.tier2_priority_states ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-950">Trust distribution</h3>
            <p className="mt-1 text-sm text-slate-500">
              Facilities grouped by exact trust_category labels.
            </p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={trustDistribution}
                  dataKey="facility_count"
                  nameKey="trust_category"
                  innerRadius={72}
                  outerRadius={112}
                  paddingAngle={2}
                >
                  {trustDistribution.map((item, index) => (
                    <Cell
                      key={item.trust_category}
                      fill={trustColors[index % trustColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, _name, props) => [
                    `${formatNumber(Number(value))} facilities (${formatPercent(
                      props.payload.percent_of_total
                    )})`,
                    "Count"
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-950">
              Recommendation readiness
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Facilities grouped by exact recommendation_readiness labels.
            </p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={readinessDistribution} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="recommendation_readiness"
                  type="category"
                  width={170}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value, _name, props) => [
                    `${formatNumber(Number(value))} facilities (${formatPercent(
                      props.payload.percent_of_total
                    )})`,
                    "Count"
                  ]}
                />
                <Bar dataKey="facility_count" radius={[0, 10, 10, 0]}>
                  {readinessDistribution.map((item, index) => (
                    <Cell
                      key={item.recommendation_readiness}
                      fill={readinessColors[index % readinessColors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-3">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-slate-950">Facility type summary</h3>
            <p className="mt-1 text-sm text-slate-500">
              Trust and readiness by facility_type.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Facility type</th>
                  <th className="px-3 py-2">Count</th>
                  <th className="px-3 py-2">Avg trust</th>
                  <th className="px-3 py-2">Ready</th>
                  <th className="px-3 py-2">High risk</th>
                </tr>
              </thead>
              <tbody>
                {facilityTypes.map((item) => (
                  <tr key={item.facility_type} className="bg-slate-50 text-slate-700">
                    <td className="rounded-l-2xl px-3 py-3 font-semibold text-slate-950">
                      {item.facility_type}
                    </td>
                    <td className="px-3 py-3">{formatNumber(item.facility_count)}</td>
                    <td className="px-3 py-3">{formatScore(item.avg_trust_score)}</td>
                    <td className="px-3 py-3">
                      {formatNumber(item.ready_for_recommendation)}
                    </td>
                    <td className="rounded-r-2xl px-3 py-3">
                      {formatNumber(item.high_risk_facilities)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-slate-950">Top priority states</h3>
            <p className="mt-1 text-sm text-slate-500">
              Calibrated national priority ranking from impact analysis.
            </p>
          </div>
          <div className="space-y-3">
            {priorityStates.map((item) => (
              <div
                key={item.state}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">
                      #{formatNumber(item.national_priority_rank)} {item.state}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {item.calibrated_priority_tier ?? "—"}
                    </p>
                  </div>
                  <Badge variant="warning">
                    Score {formatScore(item.overall_priority_score)}
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-slate-500">Facilities</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {formatNumber(item.total_facilities)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Ready</p>
                    <p className="mt-1 font-semibold text-emerald-700">
                      {formatPercent(item.ready_percent)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Do not rec.</p>
                    <p className="mt-1 font-semibold text-red-700">
                      {formatPercent(item.do_not_recommend_percent)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm">
        <span className="font-semibold text-slate-900">Safety note: </span>
        CareGrid provides evidence-based decision support. Real-world healthcare
        decisions must be verified with local providers and official emergency channels.
      </div>
    </section>
  );
}
