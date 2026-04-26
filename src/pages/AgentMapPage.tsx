import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { recommendFacilitiesAiReady, getFacilityFilters, getStateRiskIndex } from "../api/caregridApi";
import { CareGridApiError } from "../api/client";
import type { FacilityFiltersMeta } from "../api/types";
import type {
  AgentEvidenceSnippet,
  AgentNormalizedResponse,
  AgentPageRequest,
  AgentRecommendationNormalized,
  AgentValidationFinding
} from "../types/agent";
import type { FacilityMapPoint, MapRegionMetric } from "../types/map";
import { Badge } from "../components/common/Badge";
import { ErrorState } from "../components/common/ErrorState";
import { IndiaMap } from "../components/map/IndiaMap";
import { getReadinessBadgeVariant, getTrustBadgeVariant } from "../components/facilities/FacilityCard";

interface AgentFormState {
  query: string;
  state: string;
  facility_type: string;
  min_trust_score: string;
  max_results: string;
  enable_vector: boolean;
  enable_web_verification: boolean;
  include_ai_explanation: boolean;
}

interface UiErrorState {
  title: string;
  message: string;
  technical: string;
}

const loadingSteps = [
  "Parsing query...",
  "Retrieving candidates...",
  "Checking evidence...",
  "Preparing map...",
  "Preparing recommendations..."
];

const examplePrompts = [
  "Find trusted ICU hospitals in Bihar",
  "Find emergency hospitals in Maharashtra",
  "Find dialysis centers in Uttar Pradesh",
  "Find oncology care in Gujarat",
  "Find maternity hospitals in Tamil Nadu",
  "Find facilities that need human verification"
];

const defaultSafetyNote =
  "This tool supports discovery and verification workflows. Confirm current capability, availability, and clinical suitability directly with the facility.";

const initialFormState: AgentFormState = {
  query: "",
  state: "",
  facility_type: "",
  min_trust_score: "",
  max_results: "5",
  enable_vector: false,
  enable_web_verification: false,
  include_ai_explanation: false
};

function toOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function displayText(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return String(value);
}

function formatScore(value: number | string | null | undefined): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toFixed(2);
  }
  if (typeof value === "string" && value.trim() !== "") {
    return value;
  }
  return "-";
}

function stringifyUnknown(value: unknown): string {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "[unserializable]";
  }
}

function toTechnicalError(error: unknown): UiErrorState {
  if (error instanceof CareGridApiError) {
    const status = error.status ? `status=${error.status}` : "status=unknown";
    const code = error.code ? `code=${error.code}` : "code=unknown";
    const details = stringifyUnknown(error.details);

    if (error.code === "ECONNABORTED") {
      return {
        title: "Request timed out",
        message: "The agent request timed out. Try again with fewer results.",
        technical: `${status}; ${code}; detail=${details}`
      };
    }

    if ((error.status ?? 0) >= 500 || (error.status ?? 0) === 0) {
      return {
        title: "Backend unavailable",
        message: "The backend is unavailable. Please ensure API is running at localhost:8000.",
        technical: `${status}; ${code}; detail=${details}`
      };
    }

    return {
      title: "Agent request failed",
      message: error.message,
      technical: `${status}; ${code}; detail=${details}`
    };
  }

  if (error instanceof Error) {
    return {
      title: "Agent request failed",
      message: error.message,
      technical: error.stack ?? error.message
    };
  }

  return {
    title: "Agent request failed",
    message: "Unexpected error while fetching recommendations.",
    technical: stringifyUnknown(error)
  };
}

function toMapMetrics(items: Array<Record<string, unknown>>): MapRegionMetric[] {
  return items.map((item) => ({
    state: typeof item.state === "string" ? item.state : "",
    total_facilities: typeof item.total_facilities === "number" ? item.total_facilities : null,
    average_trust_score: typeof item.avg_trust_score === "number" ? item.avg_trust_score : null,
    high_risk_percent: typeof item.high_risk_percent === "number" ? item.high_risk_percent : null,
    ready_percent: typeof item.ready_percent === "number" ? item.ready_percent : null,
    risk_level: typeof item.risk_level === "string" ? item.risk_level : null
  }));
}

function toFacilityMapPoint(item: AgentRecommendationNormalized): FacilityMapPoint | null {
  if (
    typeof item.latitude !== "number" ||
    typeof item.longitude !== "number" ||
    !Number.isFinite(item.latitude) ||
    !Number.isFinite(item.longitude)
  ) {
    return null;
  }

  return {
    facility_id: item.facility_id,
    name: item.name,
    city: item.city,
    state: item.state,
    latitude: item.latitude,
    longitude: item.longitude,
    facility_type: item.facility_type,
    trust_score: item.trust_score,
    trust_category: item.trust_category,
    recommendation_readiness: item.recommendation_readiness,
    final_score: item.final_score,
    reason_for_recommendation: item.reason_for_recommendation
  };
}

function EvidenceList({ snippets }: { snippets: AgentEvidenceSnippet[] }) {
  if (snippets.length === 0) {
    return <p className="text-xs text-slate-500">No evidence snippets.</p>;
  }

  return (
    <div className="space-y-2">
      {snippets.slice(0, 4).map((snippet, index) => (
        <div key={`${snippet.facility_id ?? "na"}-${index}`} className="rounded-lg bg-slate-50 p-2">
          <p className="text-xs font-semibold text-slate-700">
            {displayText(snippet.source)} | {displayText(snippet.support_level)}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-600">{displayText(snippet.excerpt)}</p>
        </div>
      ))}
    </div>
  );
}

function ValidationList({ findings }: { findings: AgentValidationFinding[] }) {
  if (findings.length === 0) {
    return <p className="text-xs text-slate-500">No validation findings.</p>;
  }

  return (
    <div className="space-y-2">
      {findings.slice(0, 4).map((finding, index) => (
        <div key={index} className="rounded-lg bg-slate-50 p-2">
          <p className="text-xs font-semibold text-slate-700">
            {displayText(finding.severity)} | {displayText(finding.finding_type)}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-600">{displayText(finding.message)}</p>
        </div>
      ))}
    </div>
  );
}

export function AgentMapPage() {
  const [filtersMeta, setFiltersMeta] = useState<FacilityFiltersMeta | null>(null);
  const [mapMetrics, setMapMetrics] = useState<MapRegionMetric[]>([]);
  const [mapMetricsError, setMapMetricsError] = useState<string | null>(null);
  const [isLoadingMapMetrics, setIsLoadingMapMetrics] = useState(true);

  const [formState, setFormState] = useState<AgentFormState>(initialFormState);
  const [response, setResponse] = useState<AgentNormalizedResponse | null>(null);
  const [requestPayload, setRequestPayload] = useState<AgentPageRequest | null>(null);
  const [uiError, setUiError] = useState<UiErrorState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);

  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const timer = window.setInterval(() => {
      setLoadingStepIndex((current) => (current >= loadingSteps.length - 1 ? current : current + 1));
    }, 700);

    return () => window.clearInterval(timer);
  }, [isLoading]);

  useEffect(() => {
    async function loadMeta() {
      try {
        const [filterMeta, risk] = await Promise.all([
          getFacilityFilters(),
          getStateRiskIndex({ limit: 100 })
        ]);
        setFiltersMeta(filterMeta);
        setMapMetrics(toMapMetrics(risk as Array<Record<string, unknown>>));
      } catch (error) {
        setMapMetricsError(error instanceof Error ? error.message : "Failed to load map overlays.");
      } finally {
        setIsLoadingMapMetrics(false);
      }
    }

    void loadMeta();
  }, []);

  const mapPoints = useMemo(() => {
    if (!response) {
      return [] as FacilityMapPoint[];
    }

    return response.recommendations
      .map((item) => toFacilityMapPoint(item))
      .filter((item): item is FacilityMapPoint => item !== null);
  }, [response]);

  const snippetsByFacility = useMemo(() => {
    const groups = new Map<string, AgentEvidenceSnippet[]>();
    if (!response) {
      return groups;
    }

    for (const snippet of response.evidence_snippets) {
      if (!snippet.facility_id) {
        continue;
      }
      const existing = groups.get(snippet.facility_id) ?? [];
      existing.push(snippet);
      groups.set(snippet.facility_id, existing);
    }

    return groups;
  }, [response]);

  const findingsByFacility = useMemo(() => {
    const grouped = new Map<string, AgentValidationFinding[]>();
    if (!response) {
      return grouped;
    }

    const findings = response.validation_findings;
    for (const rec of response.recommendations) {
      grouped.set(rec.facility_id, findings);
    }
    return grouped;
  }, [response]);

  useEffect(() => {
    if (!selectedFacilityId) {
      return;
    }

    const target = cardRefs.current[selectedFacilityId];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedFacilityId]);

  function buildRequestPayload(): AgentPageRequest | null {
    const query = formState.query.trim();
    if (!query) {
      return null;
    }

    return {
      query,
      state: formState.state.trim() || undefined,
      facility_type: formState.facility_type.trim() || undefined,
      min_trust_score: toOptionalNumber(formState.min_trust_score),
      max_results: toOptionalNumber(formState.max_results) ?? 5,
      enable_vector: formState.enable_vector,
      enable_web_verification: formState.enable_web_verification,
      include_ai_explanation: formState.include_ai_explanation
    };
  }

  const runRecommendation = useCallback(async () => {
    const payload = buildRequestPayload();
    if (!payload) {
      setUiError({
        title: "Agent request failed",
        message: "Enter a query before requesting recommendations.",
        technical: "query is empty"
      });
      return;
    }

    setIsLoading(true);
    setLoadingStepIndex(0);
    setUiError(null);
    setRequestPayload(payload);
    setSelectedFacilityId(null);

    try {
      const normalized = await recommendFacilitiesAiReady(payload);

      if (normalized.fallback_message) {
        setUiError({
          title: "Backend fallback message",
          message: normalized.fallback_message,
          technical: "fallback_message returned by backend"
        });
      } else if (normalized.recommendations.length === 0) {
        setUiError({
          title: "Empty result",
          message: "No recommendations matched this query and filter set.",
          technical: "normalized.recommendations.length === 0"
        });
      }

      setResponse(normalized);
    } catch (error) {
      setUiError(toTechnicalError(error));
      setResponse(null);
    } finally {
      setIsLoading(false);
    }
  }, [formState]);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">Agent + Map default</Badge>
          <Badge variant="info">Backend-only integration</Badge>
          <Badge variant="default">AI-ready schema</Badge>
        </div>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">CareGrid India</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          AI-ready healthcare trust intelligence. Ask a healthcare query and inspect recommended
          facilities directly on the India map.
        </p>
      </div>

      {uiError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <ErrorState title={uiError.title} message={uiError.message} />
          <details className="mt-3 rounded-xl border border-red-200 bg-white p-3">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-red-700">
              Technical details
            </summary>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-slate-700">{uiError.technical}</pre>
          </details>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[40%_60%]">
        <div className="space-y-4 xl:max-h-[980px] xl:overflow-y-auto xl:pr-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Healthcare query</span>
              <textarea
                className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                placeholder="Find trusted ICU hospitals in Bihar"
                value={formState.query}
                onChange={(event) => setFormState((current) => ({ ...current, query: event.target.value }))}
              />
            </label>

            <div className="mt-3 flex flex-wrap gap-2">
              {examplePrompts.map((prompt) => (
                <button
                  key={prompt}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-teal-300 hover:bg-teal-50"
                  type="button"
                  onClick={() => setFormState((current) => ({ ...current, query: prompt }))}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">State</span>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={formState.state}
                  onChange={(event) => setFormState((current) => ({ ...current, state: event.target.value }))}
                >
                  <option value="">Any state</option>
                  {filtersMeta?.states.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Facility type</span>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={formState.facility_type}
                  onChange={(event) => setFormState((current) => ({ ...current, facility_type: event.target.value }))}
                >
                  <option value="">Any type</option>
                  {filtersMeta?.facility_types.map((facilityType) => (
                    <option key={facilityType} value={facilityType}>{facilityType}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Min trust score</span>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  type="number"
                  min={0}
                  max={100}
                  value={formState.min_trust_score}
                  onChange={(event) => setFormState((current) => ({ ...current, min_trust_score: event.target.value }))}
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Max results</span>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={formState.max_results}
                  onChange={(event) => setFormState((current) => ({ ...current, max_results: event.target.value }))}
                >
                  {[3, 5, 8, 10, 15, 20].map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm md:grid-cols-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formState.enable_vector} onChange={(event) => setFormState((current) => ({ ...current, enable_vector: event.target.checked }))} />
                Enable vector search
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formState.enable_web_verification} onChange={(event) => setFormState((current) => ({ ...current, enable_web_verification: event.target.checked }))} />
                Enable web verification
              </label>
              <label className="flex items-center gap-2 md:col-span-2">
                <input type="checkbox" checked={formState.include_ai_explanation} onChange={(event) => setFormState((current) => ({ ...current, include_ai_explanation: event.target.checked }))} />
                AI explanation
              </label>
            </div>

            <details className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-700">Advanced options</summary>
              <p className="mt-2 text-xs text-slate-600">
                Unknown future request fields are sent through the API adapter, with legacy fallback retry if backend rejects them.
              </p>
            </details>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                type="button"
                disabled={isLoading}
                onClick={() => void runRecommendation()}
              >
                {isLoading ? loadingSteps[loadingStepIndex] : "Get recommendations"}
              </button>
              <button
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                type="button"
                onClick={() => {
                  setFormState(initialFormState);
                  setResponse(null);
                  setUiError(null);
                  setSelectedFacilityId(null);
                  setRequestPayload(null);
                }}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">AI-ready summary</h3>
            {response?.ai_answer || response?.ai_summary ? (
              <div className="mt-3 space-y-2">
                {response.ai_answer ? <p className="text-sm text-slate-800">{response.ai_answer}</p> : null}
                {response.ai_summary ? <p className="text-sm text-slate-700">{response.ai_summary}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">model: {displayText(response.model_used)}</Badge>
                  <Badge variant="default">provider: {displayText(response.model_provider)}</Badge>
                  <Badge variant="default">confidence: {formatScore(response.ai_confidence)}</Badge>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">
                AI explanation will appear here once the backend AI model is enabled.
              </p>
            )}
          </div>

          {response ? (
            <div className="space-y-3">
              {response.recommendations.map((item, index) => {
                const hasCoords = typeof item.latitude === "number" && typeof item.longitude === "number";
                const evidence = snippetsByFacility.get(item.facility_id) ?? [];
                const findings = findingsByFacility.get(item.facility_id) ?? [];
                const isSelected = selectedFacilityId === item.facility_id;

                return (
                  <button
                    key={`${item.facility_id}-${index}`}
                    ref={(node) => {
                      cardRefs.current[item.facility_id] = node;
                    }}
                    type="button"
                    className={[
                      "w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition",
                      isSelected
                        ? "border-teal-500 ring-2 ring-teal-200"
                        : "border-slate-200 hover:border-slate-300"
                    ].join(" ")}
                    onClick={() => setSelectedFacilityId(item.facility_id)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="info">#{index + 1}</Badge>
                      <Badge variant="default">{displayText(item.facility_type)}</Badge>
                      <Badge variant={getTrustBadgeVariant(item.trust_category ?? "")}>{displayText(item.trust_category)}</Badge>
                      <Badge variant={getReadinessBadgeVariant(item.recommendation_readiness ?? "")}>{displayText(item.recommendation_readiness)}</Badge>
                      <Badge variant="warning">score {formatScore(item.final_score)}</Badge>
                      {!hasCoords ? <Badge variant="danger">No coordinates available</Badge> : null}
                    </div>

                    <h4 className="mt-3 text-lg font-bold text-slate-950">{item.name}</h4>
                    <p className="mt-1 text-sm text-slate-500">{displayText(item.city)}, {displayText(item.state)}</p>
                    <p className="mt-2 text-sm text-slate-700">{displayText(item.reason_for_recommendation)}</p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <Badge variant="default">trust score: {formatScore(item.trust_score)}</Badge>
                      <Badge variant="default">vector sim: {formatScore(response.vector.vector_similarity_component)}</Badge>
                      <Badge variant="default">web status: {displayText(response.web_verification.verification_status)}</Badge>
                    </div>

                    {item.human_next_steps.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.human_next_steps.map((step) => (
                          <Badge key={`${item.facility_id}-${step}`} variant="warning">{step}</Badge>
                        ))}
                      </div>
                    ) : null}

                    {item.warning_flags.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.warning_flags.map((flag) => (
                          <Badge key={`${item.facility_id}-${flag}`} variant="danger">{flag}</Badge>
                        ))}
                      </div>
                    ) : null}

                    <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
                      <summary className="cursor-pointer text-xs font-semibold text-slate-700">Evidence snippets</summary>
                      <div className="mt-2"><EvidenceList snippets={evidence} /></div>
                    </details>

                    <details className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                      <summary className="cursor-pointer text-xs font-semibold text-slate-700">Validation findings</summary>
                      <div className="mt-2"><ValidationList findings={findings} /></div>
                    </details>
                  </button>
                );
              })}
            </div>
          ) : null}

          {response ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <span className="font-semibold">Safety note: </span>
              {response.safety_note ?? defaultSafetyNote}
            </div>
          ) : null}

          {requestPayload ? (
            <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <summary className="cursor-pointer text-sm font-semibold text-slate-700">Trace / Debug</summary>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs text-slate-700">{stringifyUnknown({ requestPayload, trace: response?.trace, raw: response?.raw_extra_fields })}</pre>
            </details>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <IndiaMap
            regionMetrics={mapMetrics}
            isLoadingMetrics={isLoadingMapMetrics}
            metricsError={mapMetricsError}
            facilityPoints={mapPoints}
            selectedFacilityId={selectedFacilityId}
            onSelectFacility={setSelectedFacilityId}
          />
        </div>
      </div>
    </section>
  );
}
