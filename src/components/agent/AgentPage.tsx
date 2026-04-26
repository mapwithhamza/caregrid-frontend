import { useCallback, useEffect, useMemo, useState } from "react";

import { recommendFacilitiesAiReady, getFacilityFilters } from "../../api/caregridApi";
import { CareGridApiError } from "../../api/client";
import type { FacilityFiltersMeta } from "../../api/types";
import type {
  AgentEvidenceSnippet,
  AgentNormalizedResponse,
  AgentPageRequest,
  AgentValidationFinding
} from "../../types/agent";
import { Badge } from "../common/Badge";
import { ErrorState } from "../common/ErrorState";
import { getReadinessBadgeVariant, getTrustBadgeVariant } from "../facilities/FacilityCard";

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
  "Retrieving facility candidates...",
  "Checking evidence...",
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

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }

  return new Intl.NumberFormat("en-IN").format(value);
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

function displayText(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

function stringifyUnknown(value: unknown): string {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => stringifyUnknown(item)).join(", ");
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
    const detail = stringifyUnknown(error.details);

    if (error.code === "ECONNABORTED") {
      return {
        title: "Request timed out",
        message:
          "The agent request took too long to complete. Try reducing max results or rerun in a moment.",
        technical: `${status}; ${code}; detail=${detail}`
      };
    }

    if ((error.status ?? 0) >= 500 || (error.status ?? 0) === 0) {
      return {
        title: "Backend unavailable",
        message:
          "The backend is currently unavailable or not reachable. Confirm the API service is running and try again.",
        technical: `${status}; ${code}; detail=${detail}`
      };
    }

    return {
      title: "Agent request failed",
      message: error.message,
      technical: `${status}; ${code}; detail=${detail}`
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
    message: "An unexpected error occurred while requesting recommendations.",
    technical: stringifyUnknown(error)
  };
}

function isPotentiallyInvalidResponse(response: AgentNormalizedResponse): boolean {
  const noStructuredSections =
    response.recommendations.length === 0 &&
    response.evidence_snippets.length === 0 &&
    response.validation_findings.length === 0 &&
    !response.ai_answer &&
    !response.ai_summary &&
    !response.ai_reasoning &&
    !response.safety_note &&
    !response.fallback_message;

  return noStructuredSections;
}

function truncateUrl(url: string, maxLength = 56): string {
  if (url.length <= maxLength) {
    return url;
  }

  return `${url.slice(0, maxLength - 3)}...`;
}

function EvidenceSnippetCard({ snippet }: { snippet: AgentEvidenceSnippet }) {
  const [expanded, setExpanded] = useState(false);
  const text = snippet.excerpt ?? "-";
  const isLong = text.length > 220;
  const visibleText = expanded || !isLong ? text : `${text.slice(0, 220)}...`;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap gap-2">
        <Badge variant="info">{displayText(snippet.source)}</Badge>
        <Badge variant="default">support: {displayText(snippet.support_level)}</Badge>
        <Badge variant="success">capability: {displayText(snippet.capability)}</Badge>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{visibleText}</p>
      {isLong ? (
        <button
          className="mt-2 text-xs font-semibold text-teal-700 hover:text-teal-900"
          type="button"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
      {snippet.url ? (
        <a
          className="mt-2 inline-block text-xs font-medium text-sky-700 underline underline-offset-2"
          href={snippet.url}
          target="_blank"
          rel="noreferrer"
          title={snippet.url}
        >
          {truncateUrl(snippet.url)}
        </a>
      ) : null}
    </div>
  );
}

function ValidationFindingCard({ finding }: { finding: AgentValidationFinding }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap gap-2">
        <Badge variant="danger">{displayText(finding.severity)}</Badge>
        <Badge variant="warning">{displayText(finding.finding_type)}</Badge>
        <Badge variant="default">rule: {displayText(finding.rule)}</Badge>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{displayText(finding.message)}</p>
      <p className="mt-2 text-xs font-semibold text-slate-500">
        Recommendation impact: {displayText(finding.recommendation_impact)}
      </p>
    </div>
  );
}

export function AgentPage() {
  const [filtersMeta, setFiltersMeta] = useState<FacilityFiltersMeta | null>(null);
  const [formState, setFormState] = useState<AgentFormState>(initialFormState);
  const [response, setResponse] = useState<AgentNormalizedResponse | null>(null);
  const [requestPayload, setRequestPayload] = useState<AgentPageRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [uiError, setUiError] = useState<UiErrorState | null>(null);

  const loadFilters = useCallback(async () => {
    try {
      setMetaError(null);
      const meta = await getFacilityFilters();
      setFiltersMeta(meta);
    } catch (error) {
      setMetaError(
        error instanceof Error ? error.message : "Unable to load filter metadata."
      );
    }
  }, []);

  useEffect(() => {
    void loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setLoadingStepIndex((current) =>
        current >= loadingSteps.length - 1 ? current : current + 1
      );
    }, 850);

    return () => window.clearInterval(intervalId);
  }, [isLoading]);

  const groupedEvidence = useMemo(() => {
    if (!response) {
      return [] as Array<{ groupKey: string; snippets: AgentEvidenceSnippet[] }>;
    }

    const groups = new Map<string, AgentEvidenceSnippet[]>();

    for (const snippet of response.evidence_snippets) {
      const groupKey =
        snippet.facility_name ??
        snippet.facility_id ??
        "General evidence";
      const existing = groups.get(groupKey) ?? [];
      existing.push(snippet);
      groups.set(groupKey, existing);
    }

    return Array.from(groups.entries()).map(([groupKey, snippets]) => ({
      groupKey,
      snippets
    }));
  }, [response]);

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

  async function runRecommendation() {
    const payload = buildRequestPayload();
    if (!payload) {
      setUiError({
        title: "Agent request failed",
        message: "Enter a query before requesting recommendations.",
        technical: "query is empty"
      });
      setResponse(null);
      return;
    }

    setIsLoading(true);
    setLoadingStepIndex(0);
    setUiError(null);
    setRequestPayload(payload);

    try {
      const normalized = await recommendFacilitiesAiReady(payload);

      if (isPotentiallyInvalidResponse(normalized)) {
        setUiError({
          title: "Invalid response shape",
          message:
            "The backend returned a response that does not include expected recommendation sections.",
          technical: "No known AI/agent sections detected after normalization."
        });
      } else if (normalized.recommendations.length === 0 && !normalized.fallback_message) {
        setUiError({
          title: "Empty result",
          message: "No recommendations matched this query and filter set.",
          technical: "normalized.recommendations.length === 0"
        });
      } else if (normalized.fallback_message) {
        setUiError({
          title: "Agent returned fallback message",
          message: normalized.fallback_message,
          technical: "fallback_message returned by backend"
        });
      }

      setResponse(normalized);
    } catch (error) {
      setUiError(toTechnicalError(error));
      setResponse(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="danger">Agent</Badge>
          <Badge variant="success">Backend-only integration</Badge>
          <Badge variant="info">AI-ready response adapter</Badge>
        </div>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
          AI-Ready Agent Interface
        </h2>
        <p className="mt-3 max-w-3xl text-slate-600">
          The frontend calls only the backend agent endpoint and renders both current and
          future AI/vector/web verification fields safely.
        </p>
      </div>

      {metaError ? (
        <ErrorState
          title="Filter metadata unavailable"
          message={metaError}
          onRetry={loadFilters}
        />
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-2 xl:col-span-3">
            <span className="text-sm font-semibold text-slate-700">Query</span>
            <textarea
              className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              placeholder="e.g. Find high-trust emergency and ICU facilities in Maharashtra"
              value={formState.query}
              onChange={(event) =>
                setFormState((current) => ({ ...current, query: event.target.value }))
              }
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">State</span>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              value={formState.state}
              onChange={(event) =>
                setFormState((current) => ({ ...current, state: event.target.value }))
              }
            >
              <option value="">Any state</option>
              {filtersMeta?.states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Facility type</span>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              value={formState.facility_type}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  facility_type: event.target.value
                }))
              }
            >
              <option value="">Any type</option>
              {filtersMeta?.facility_types.map((facilityType) => (
                <option key={facilityType} value={facilityType}>
                  {facilityType}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Min trust score</span>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              min={0}
              max={100}
              placeholder="optional"
              type="number"
              value={formState.min_trust_score}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  min_trust_score: event.target.value
                }))
              }
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Max results</span>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              value={formState.max_results}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  max_results: event.target.value
                }))
              }
            >
              {[3, 5, 8, 10, 15, 20].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {examplePrompts.map((prompt) => (
            <button
              key={prompt}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50"
              type="button"
              onClick={() => setFormState((current) => ({ ...current, query: prompt }))}
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              className="h-4 w-4 rounded border-slate-300"
              type="checkbox"
              checked={formState.enable_vector}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  enable_vector: event.target.checked
                }))
              }
            />
            Enable vector search
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              className="h-4 w-4 rounded border-slate-300"
              type="checkbox"
              checked={formState.enable_web_verification}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  enable_web_verification: event.target.checked
                }))
              }
            />
            Enable web verification
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              className="h-4 w-4 rounded border-slate-300"
              type="checkbox"
              checked={formState.include_ai_explanation}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  include_ai_explanation: event.target.checked
                }))
              }
            />
            AI explanation
          </label>
        </div>

        <details className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-800">
            Advanced options
          </summary>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            AI-ready options are included in the request payload. If the backend currently
            rejects unknown fields, the API client automatically retries with legacy-safe
            fields to preserve compatibility.
          </p>
        </details>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={isLoading}
            onClick={() => void runRecommendation()}
          >
            {isLoading ? loadingSteps[loadingStepIndex] : "Get recommendations"}
          </button>
          <button
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            type="button"
            onClick={() => {
              setFormState(initialFormState);
              setResponse(null);
              setUiError(null);
              setRequestPayload(null);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {uiError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <ErrorState title={uiError.title} message={uiError.message} />
          <details className="mt-3 rounded-xl border border-red-200 bg-white p-3">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-red-700">
              Technical details
            </summary>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-slate-700">
              {uiError.technical}
            </pre>
          </details>
        </div>
      ) : null}

      {response ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">mode: {displayText(response.agent_mode)}</Badge>
              <Badge variant="success">
                candidates: {formatNumber(response.total_candidates)}
              </Badge>
              <Badge variant="warning">returned: {formatNumber(response.returned)}</Badge>
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-950">AI summary / answer</h3>
            {response.ai_answer || response.ai_summary ? (
              <div className="mt-3 space-y-3">
                {response.ai_answer ? (
                  <p className="text-sm leading-6 text-slate-800">{response.ai_answer}</p>
                ) : null}
                {response.ai_summary ? (
                  <p className="text-sm leading-6 text-slate-700">{response.ai_summary}</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">model: {displayText(response.model_used)}</Badge>
                  <Badge variant="default">provider: {displayText(response.model_provider)}</Badge>
                  <Badge variant="default">
                    confidence: {formatScore(response.ai_confidence)}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-600">
                AI explanation will appear here once the backend AI model is enabled.
              </p>
            )}

            {response.ai_reasoning ? (
              <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                  AI reasoning
                </summary>
                <p className="mt-2 text-sm leading-6 text-slate-700">{response.ai_reasoning}</p>
              </details>
            ) : null}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-950">Recommended Facilities</h3>
            {response.recommendations.map((item) => (
              <article
                key={`${item.facility_id}-${item.name}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="default">{displayText(item.facility_type)}</Badge>
                  <Badge variant={getTrustBadgeVariant(item.trust_category ?? "")}>{displayText(item.trust_category)}</Badge>
                  <Badge variant={getReadinessBadgeVariant(item.recommendation_readiness ?? "")}>
                    {displayText(item.recommendation_readiness)}
                  </Badge>
                  <Badge variant="info">final score: {formatScore(item.final_score)}</Badge>
                </div>

                <h4 className="mt-3 text-xl font-bold text-slate-950">{item.name}</h4>
                <p className="mt-1 text-sm text-slate-500">
                  {displayText(item.city)}, {displayText(item.state)}
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  Trust score: {formatScore(item.trust_score)}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {displayText(item.reason_for_recommendation)}
                </p>

                {item.human_next_steps.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Human next steps
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.human_next_steps.map((step) => (
                        <Badge key={`${item.facility_id}-${step}`} variant="warning">
                          {step}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                {item.warning_flags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.warning_flags.map((warning) => (
                      <Badge key={`${item.facility_id}-${warning}`} variant="danger">
                        {warning}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">Evidence Snippets</h3>
            {groupedEvidence.length > 0 ? (
              <div className="mt-4 space-y-4">
                {groupedEvidence.map((group) => (
                  <div key={group.groupKey}>
                    <p className="mb-2 text-sm font-semibold text-slate-800">{group.groupKey}</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {group.snippets.map((snippet, index) => (
                        <EvidenceSnippetCard
                          key={`${group.groupKey}-${index}`}
                          snippet={snippet}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">
                No evidence snippets were returned for this response.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">Validation Findings</h3>
            {response.validation_findings.length > 0 ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {response.validation_findings.map((finding, index) => (
                  <ValidationFindingCard key={index} finding={finding} />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">
                No validation findings were returned for this response.
              </p>
            )}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-950">Vector Retrieval</h3>
              {response.vector.vector_enabled !== undefined ||
              response.vector.vector_available !== undefined ||
              response.vector.vector_count !== null ? (
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p>vector_enabled: {displayText(response.vector.vector_enabled)}</p>
                  <p>vector_available: {displayText(response.vector.vector_available)}</p>
                  <p>vector_count: {formatNumber(response.vector.vector_count)}</p>
                  <p>vector_reason: {displayText(response.vector.vector_reason)}</p>
                  <p>
                    vector_similarity_component: {formatScore(response.vector.vector_similarity_component)}
                  </p>
                  {response.vector.vector_index ? (
                    <p>vector_index: {response.vector.vector_index}</p>
                  ) : null}
                  {response.vector.vector_endpoint ? (
                    <p>vector_endpoint: {response.vector.vector_endpoint}</p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-600">
                  Vector retrieval not enabled for this response.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-950">Tavily / Web Verification</h3>
              {response.web_verification.web_checked !== undefined ||
              response.web_verification.web_available !== undefined ||
              response.web_verification.web_verification_enabled !== undefined ? (
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p>web_checked: {displayText(response.web_verification.web_checked)}</p>
                  <p>web_available: {displayText(response.web_verification.web_available)}</p>
                  <p>
                    verification_status: {displayText(response.web_verification.verification_status)}
                  </p>
                  <p>
                    verification_score: {formatScore(response.web_verification.verification_score)}
                  </p>
                  <p>
                    tavily_verified_count: {formatNumber(response.web_verification.tavily_verified_count)}
                  </p>
                  <p>
                    credits_estimated: {formatNumber(response.web_verification.credits_estimated)}
                  </p>
                  {response.web_verification.top_url ? (
                    <a
                      className="inline-block text-xs font-medium text-sky-700 underline underline-offset-2"
                      href={response.web_verification.top_url}
                      target="_blank"
                      rel="noreferrer"
                      title={response.web_verification.top_url}
                    >
                      {truncateUrl(response.web_verification.top_url)}
                    </a>
                  ) : null}
                  {response.web_verification.top_snippet ? (
                    <p className="text-xs leading-5 text-slate-600">
                      {response.web_verification.top_snippet}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-600">
                  Web verification not enabled for this response.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-amber-900">Safety Note</h3>
            <p className="mt-2 text-sm leading-6 text-amber-800">
              {response.safety_note ?? defaultSafetyNote}
            </p>
          </div>

          <details className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <summary className="cursor-pointer text-lg font-semibold text-slate-950">
              Trace / Debug Panel
            </summary>
            <div className="mt-4 space-y-4 text-sm text-slate-700">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Retrieval summary
                </p>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs">
                  {stringifyUnknown(response.trace.retrieval_summary)}
                </pre>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Trace summary
                </p>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs">
                  {stringifyUnknown(response.trace.trace_summary)}
                </pre>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Request timing (ms)
                </p>
                <p className="mt-2 rounded-xl bg-slate-50 p-3 text-xs">
                  {formatNumber(response.trace.request_timing_ms)}
                </p>
              </div>

              <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Additional response data
                </summary>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-slate-700">
                  {stringifyUnknown(response.raw_extra_fields)}
                </pre>
              </details>

              <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Request payload
                </summary>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-slate-700">
                  {stringifyUnknown(requestPayload)}
                </pre>
              </details>
            </div>
          </details>
        </div>
      ) : null}
    </section>
  );
}
