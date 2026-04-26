import { useCallback, useEffect, useState } from "react";

import { getStateRiskIndex } from "../api/caregridApi";
import type { StateRiskIndexItem } from "../api/types";
import { IndiaMap } from "../components/map/IndiaMap";
import { Badge } from "../components/common/Badge";
import { ErrorState } from "../components/common/ErrorState";
import type { MapRegionMetric } from "../types/map";

function toMapMetrics(items: StateRiskIndexItem[]): MapRegionMetric[] {
  return items.map((item) => ({
    state: item.state,
    total_facilities:
      typeof item.total_facilities === "number" ? item.total_facilities : null,
    average_trust_score:
      typeof item.avg_trust_score === "number" ? item.avg_trust_score : null,
    high_risk_percent:
      typeof item.high_risk_percent === "number" ? item.high_risk_percent : null,
    ready_percent: typeof item.ready_percent === "number" ? item.ready_percent : null,
    risk_level: typeof item.risk_level === "string" ? item.risk_level : null
  }));
}

export function MapPage() {
  const [metrics, setMetrics] = useState<MapRegionMetric[]>([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    setIsLoadingMetrics(true);
    setMetricsError(null);

    try {
      const riskData = await getStateRiskIndex({ limit: 100 });
      setMetrics(toMapMetrics(riskData));
    } catch (error) {
      setMetricsError(
        error instanceof Error
          ? error.message
          : "Unable to load state risk metrics for map overlay."
      );
      setMetrics([]);
    } finally {
      setIsLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  return (
    <section className="space-y-6">
      <div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="info">GIS Map</Badge>
          <Badge variant="success">Mapbox dark</Badge>
          <Badge variant="default">India boundaries</Badge>
        </div>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
          CareGrid India Health Access Map
        </h2>
        <p className="mt-3 max-w-3xl text-slate-600">
          Trust, readiness and verification view across India. Facility and trust overlays are
          prepared to connect to backend metrics and recommendations.
        </p>
      </div>

      {metricsError ? (
        <ErrorState
          title="Map metrics unavailable"
          message={`${metricsError} The map will render neutral boundaries.`}
          onRetry={loadMetrics}
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-3">
          <IndiaMap
            regionMetrics={metrics}
            isLoadingMetrics={isLoadingMetrics}
            metricsError={metricsError}
          />
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Legend</h3>
          <div className="space-y-2 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-emerald-500" />
              High Trust
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-sky-500" />
              Moderate Trust
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-amber-500" />
              Low Trust
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-red-600" />
              High Risk / Trust Desert
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-slate-600" />
              No overlay data
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            Hover a region to inspect mapped state-level properties. Choropleth shading uses
            optional backend risk metrics when state-name matching succeeds.
          </div>
        </div>
      </div>
    </section>
  );
}
