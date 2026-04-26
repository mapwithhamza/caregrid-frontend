import type { AgentRecommendRequest, AgentRecommendResponse } from "./types";
import type {
  AgentEvidenceSnippet,
  AgentNormalizedResponse,
  AgentPageRequest,
  AgentRecommendationNormalized,
  AgentValidationFinding
} from "../types/agent";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : null))
      .filter((item): item is string => item !== null);
  }
  if (typeof value === "string" && value.trim() !== "") {
    return [value];
  }
  return [];
}

function pickUnknownFields(
  source: Record<string, unknown>,
  knownKeys: string[]
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(source).filter(([key]) => !knownKeys.includes(key))
  );
}

function normalizeRecommendation(value: unknown): AgentRecommendationNormalized | null {
  if (!isRecord(value)) {
    return null;
  }

  const knownKeys = [
    "facility_id",
    "name",
    "city",
    "state",
    "latitude",
    "longitude",
    "facility_type",
    "trust_score",
    "trust_category",
    "recommendation_readiness",
    "recommendation_score",
    "final_score",
    "reason_for_recommendation",
    "human_next_steps",
    "warning_flags",
    "evidence_summary",
    "score_breakdown"
  ];

  return {
    facility_id: asString(value.facility_id) ?? "",
    name: asString(value.name) ?? "Unknown facility",
    city: asString(value.city),
    state: asString(value.state),
    latitude: asNumber(value.latitude),
    longitude: asNumber(value.longitude),
    facility_type: asString(value.facility_type),
    trust_score: asNumber(value.trust_score),
    trust_category: asString(value.trust_category),
    recommendation_readiness: asString(value.recommendation_readiness),
    final_score: asNumber(value.final_score) ?? asNumber(value.recommendation_score),
    reason_for_recommendation: asString(value.reason_for_recommendation),
    human_next_steps: toStringArray(value.human_next_steps),
    warning_flags: toStringArray(value.warning_flags),
    evidence_summary: asString(value.evidence_summary),
    score_breakdown: isRecord(value.score_breakdown) ? value.score_breakdown : null,
    raw_extra_fields: pickUnknownFields(value, knownKeys)
  };
}

function normalizeEvidenceSnippet(value: unknown): AgentEvidenceSnippet | null {
  if (!isRecord(value)) {
    return null;
  }

  const knownKeys = [
    "facility_id",
    "facility_name",
    "source",
    "support_level",
    "capability",
    "excerpt",
    "url"
  ];

  return {
    facility_id: asString(value.facility_id),
    facility_name: asString(value.facility_name),
    source: asString(value.source),
    support_level: asString(value.support_level),
    capability: asString(value.capability),
    excerpt: asString(value.excerpt),
    url: asString(value.url),
    raw_extra_fields: pickUnknownFields(value, knownKeys)
  };
}

function normalizeValidationFinding(value: unknown): AgentValidationFinding | null {
  if (!isRecord(value)) {
    return null;
  }

  const knownKeys = ["severity", "finding_type", "rule", "message", "recommendation_impact"];

  return {
    severity: asString(value.severity),
    finding_type: asString(value.finding_type),
    rule: asString(value.rule),
    message: asString(value.message),
    recommendation_impact: asString(value.recommendation_impact),
    raw_extra_fields: pickUnknownFields(value, knownKeys)
  };
}

export function buildAgentRecommendPayload(
  input: AgentPageRequest
): AgentRecommendRequest & Record<string, unknown> {
  const payload: AgentRecommendRequest & Record<string, unknown> = {
    query: input.query,
    max_results: input.max_results,
    state: input.state,
    facility_type: input.facility_type,
    min_trust_score: input.min_trust_score
  };

  if (input.enable_vector !== undefined) {
    payload.enable_vector = input.enable_vector;
  }
  if (input.enable_web_verification !== undefined) {
    payload.enable_web_verification = input.enable_web_verification;
  }
  if (input.include_ai_explanation !== undefined) {
    payload.include_ai_explanation = input.include_ai_explanation;
  }

  return payload;
}

export function buildLegacyAgentRecommendPayload(input: AgentPageRequest): AgentRecommendRequest {
  return {
    query: input.query,
    max_results: input.max_results,
    state: input.state,
    facility_type: input.facility_type,
    min_trust_score: input.min_trust_score
  };
}

export function normalizeAgentResponse(
  rawResponse: AgentRecommendResponse | Record<string, unknown>,
  requestTimingMs?: number
): AgentNormalizedResponse {
  const raw = isRecord(rawResponse) ? rawResponse : {};

  const knownTopLevelKeys = [
    "query",
    "agent_mode",
    "model_used",
    "model_provider",
    "ai_summary",
    "ai_reasoning",
    "ai_answer",
    "ai_limitations",
    "ai_confidence",
    "ai_next_steps",
    "interpreted_intent",
    "total_candidates",
    "returned",
    "recommendations",
    "evidence_snippets",
    "validation_findings",
    "warning_flags",
    "score_breakdown",
    "safety_note",
    "human_next_steps",
    "fallback_message",
    "retrieval_summary",
    "trace_summary",
    "vector_enabled",
    "vector_available",
    "vector_count",
    "vector_reason",
    "vector_similarity_component",
    "vector_index",
    "vector_endpoint",
    "web_verification_enabled",
    "web_checked",
    "web_available",
    "verification_status",
    "verification_score",
    "top_url",
    "top_snippet",
    "credits_estimated",
    "tavily_verified_count",
    "raw_extra_fields"
  ];

  const normalized: AgentNormalizedResponse = {
    query: asString(raw.query) ?? "",
    agent_mode: asString(raw.agent_mode),
    model_used: asString(raw.model_used),
    model_provider: asString(raw.model_provider),
    ai_summary: asString(raw.ai_summary),
    ai_reasoning: asString(raw.ai_reasoning) ?? asString(raw.reasoning),
    ai_answer: asString(raw.ai_answer),
    ai_limitations: asString(raw.ai_limitations),
    ai_confidence:
      asNumber(raw.ai_confidence) ??
      (typeof raw.ai_confidence === "string" ? raw.ai_confidence : null),
    ai_next_steps: toStringArray(raw.ai_next_steps),
    interpreted_intent: isRecord(raw.interpreted_intent) ? raw.interpreted_intent : {},
    total_candidates: asNumber(raw.total_candidates),
    returned: asNumber(raw.returned),
    recommendations: Array.isArray(raw.recommendations)
      ? raw.recommendations
          .map((item) => normalizeRecommendation(item))
          .filter((item): item is AgentRecommendationNormalized => item !== null)
      : [],
    evidence_snippets: Array.isArray(raw.evidence_snippets)
      ? raw.evidence_snippets
          .map((item) => normalizeEvidenceSnippet(item))
          .filter((item): item is AgentEvidenceSnippet => item !== null)
      : [],
    validation_findings: Array.isArray(raw.validation_findings)
      ? raw.validation_findings
          .map((item) => normalizeValidationFinding(item))
          .filter((item): item is AgentValidationFinding => item !== null)
      : [],
    warning_flags: toStringArray(raw.warning_flags),
    score_breakdown: isRecord(raw.score_breakdown) ? raw.score_breakdown : null,
    safety_note: asString(raw.safety_note),
    human_next_steps: toStringArray(raw.human_next_steps),
    fallback_message: asString(raw.fallback_message),
    vector: {
      vector_enabled: asBoolean(raw.vector_enabled),
      vector_available: asBoolean(raw.vector_available),
      vector_count: asNumber(raw.vector_count),
      vector_reason: asString(raw.vector_reason),
      vector_similarity_component: asNumber(raw.vector_similarity_component),
      vector_index: asString(raw.vector_index),
      vector_endpoint: asString(raw.vector_endpoint)
    },
    web_verification: {
      web_checked: asBoolean(raw.web_checked),
      web_available: asBoolean(raw.web_available),
      web_verification_enabled: asBoolean(raw.web_verification_enabled),
      verification_status: asString(raw.verification_status),
      verification_score: asNumber(raw.verification_score),
      top_url: asString(raw.top_url),
      top_snippet: asString(raw.top_snippet),
      credits_estimated: asNumber(raw.credits_estimated),
      tavily_verified_count: asNumber(raw.tavily_verified_count)
    },
    trace: {
      retrieval_summary: raw.retrieval_summary,
      trace_summary: raw.trace_summary,
      request_timing_ms: requestTimingMs ?? null
    },
    raw_extra_fields: {
      ...pickUnknownFields(raw, knownTopLevelKeys),
      ...(isRecord(raw.raw_extra_fields) ? raw.raw_extra_fields : {})
    }
  };

  return normalized;
}
