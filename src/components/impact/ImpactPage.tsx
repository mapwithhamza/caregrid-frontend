import { useCallback, useEffect, useState } from "react";

import {
  getFacilityTypeGap,
  getPriorityStates,
  getStateRiskIndex,
  getTrustGapSummary
} from "../../api/caregridApi";
import type {
  FacilityTypeGapItem,
  PriorityStateItem,
  StateRiskIndexItem,
  TrustGapSummary
} from "../../api/types";
import { Badge } from "../common/Badge";
import { ErrorState } from "../common/ErrorState";
import { LoadingState } from "../common/LoadingState";

interface ImpactData {
  trustGapSummary: TrustGapSummary;
  priorityStates: PriorityStateItem[];
  stateRiskIndex: StateRiskIndexItem[];
  facilityTypeGap: FacilityTypeGapItem[];
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }

  return new Intl.NumberFormat("en-IN").format(value);
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }

  return `${value.toFixed(1)}%`;
}

function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }

  return value.toFixed(1);
}

export function ImpactPage() {
  const [impactData, setImpactData] = useState<ImpactData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadImpactData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [trustGapSummary, priorityStates, stateRiskIndex, facilityTypeGap] =
        await Promise.all([
          getTrustGapSummary(),
          getPriorityStates({ limit: 10 }),
          getStateRiskIndex({ sort_by: "trust_desert_risk_index", order: "desc", limit: 15 }),
          getFacilityTypeGap({ sort_by: "do_not_recommend_percent", order: "desc" })
        ]);

      setImpactData({
        trustGapSummary,
        priorityStates,
        stateRiskIndex,
        facilityTypeGap
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load impact analysis data."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadImpactData();
  }, [loadImpactData]);

  if (isLoading) {
    return <LoadingState label="Loading trust desert impact data..." />;
  }

  if (errorMessage || !impactData) {
    return (
      <ErrorState
        title="Impact data unavailable"
        message={errorMessage ?? "The impact response was empty."}
        onRetry={loadImpactData}
      />
    );
  }

  const { trustGapSummary, priorityStates, stateRiskIndex, facilityTypeGap } = impactData;

  return (
    <section className="space-y-6">
      <div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="warning">Impact</Badge>
          <Badge variant="success">Live API</Badge>
          <Badge variant="info">Trust desert signals</Badge>
        </div>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
          Trust Desert Analysis
        </h2>
        <p className="mt-3 max-w-3xl text-slate-600">
          State-level reliability risk, priority tiers, and facility-type gaps from the
          backend impact dataset.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 p-6 text-white">
          <h3 className="text-2xl font-bold tracking-tight">National trust gap summary</h3>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
            {trustGapSummary.headline_insight ?? "No headline insight available."}
          </p>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total facilities
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {formatNumber(trustGapSummary.total_facilities)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Avg trust score
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {formatScore(trustGapSummary.average_trust_score)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              High-risk percent
            </p>
            <p className="mt-2 text-2xl font-bold text-red-700">
              {formatPercent(trustGapSummary.high_risk_percent)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Ready percent
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">
              {formatPercent(trustGapSummary.ready_percent)}
            </p>
          </div>
        </div>
        <div className="border-t border-slate-200 p-6 text-sm leading-6 text-slate-700">
          <p>
            <span className="font-semibold text-slate-900">Planning interpretation: </span>
            {trustGapSummary.planning_interpretation ?? "No planning interpretation available."}
          </p>
          <p className="mt-3">
            <span className="font-semibold text-slate-900">Tier 1 priority states: </span>
            {trustGapSummary.tier1_priority_states ?? "-"}
          </p>
          <p className="mt-1">
            <span className="font-semibold text-slate-900">Tier 2 priority states: </span>
            {trustGapSummary.tier2_priority_states ?? "-"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">Priority states</h3>
          <p className="mt-1 text-sm text-slate-500">
            Ranked output from GET /impact/priority-states.
          </p>
          <div className="mt-4 space-y-3">
            {priorityStates.map((item) => (
              <div
                key={`${item.state}-${String(item.national_priority_rank ?? "na")}`}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">
                      #{formatNumber(item.national_priority_rank)} {item.state}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.calibrated_priority_tier ?? "-"} | confidence{" "}
                      {item.analysis_confidence ?? "-"}
                    </p>
                  </div>
                  <Badge variant="warning">
                    score {formatScore(item.overall_priority_score)}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
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

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">State risk index</h3>
          <p className="mt-1 text-sm text-slate-500">
            Highest trust_desert_risk_index states from GET /impact/state-risk-index.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">State</th>
                  <th className="px-3 py-2">Risk level</th>
                  <th className="px-3 py-2">Risk index</th>
                  <th className="px-3 py-2">High risk %</th>
                  <th className="px-3 py-2">Ready %</th>
                </tr>
              </thead>
              <tbody>
                {stateRiskIndex.map((item) => (
                  <tr key={item.state} className="bg-slate-50 text-slate-700">
                    <td className="rounded-l-2xl px-3 py-3 font-semibold text-slate-950">
                      {item.state}
                    </td>
                    <td className="px-3 py-3">{item.risk_level ?? "-"}</td>
                    <td className="px-3 py-3">
                      {formatScore(item.trust_desert_risk_index)}
                    </td>
                    <td className="px-3 py-3">{formatPercent(item.high_risk_percent)}</td>
                    <td className="rounded-r-2xl px-3 py-3">
                      {formatPercent(item.ready_percent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950">Facility type reliability gaps</h3>
        <p className="mt-1 text-sm text-slate-500">
          Sorted by do_not_recommend_percent from GET /impact/facility-type-gap.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Facility type</th>
                <th className="px-3 py-2">Risk level</th>
                <th className="px-3 py-2">Avg trust</th>
                <th className="px-3 py-2">High risk %</th>
                <th className="px-3 py-2">Do not rec. %</th>
                <th className="px-3 py-2">Ready %</th>
              </tr>
            </thead>
            <tbody>
              {facilityTypeGap.map((item) => (
                <tr key={item.facility_type} className="bg-slate-50 text-slate-700">
                  <td className="rounded-l-2xl px-3 py-3 font-semibold text-slate-950">
                    {item.facility_type}
                  </td>
                  <td className="px-3 py-3">{item.facility_type_risk_level ?? "-"}</td>
                  <td className="px-3 py-3">{formatScore(item.avg_trust_score)}</td>
                  <td className="px-3 py-3">{formatPercent(item.high_risk_percent)}</td>
                  <td className="px-3 py-3 text-red-700">
                    {formatPercent(item.do_not_recommend_percent)}
                  </td>
                  <td className="rounded-r-2xl px-3 py-3 text-emerald-700">
                    {formatPercent(item.ready_percent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
