export interface AgentPageRequest {
  query: string;
  state?: string;
  facility_type?: string;
  min_trust_score?: number;
  max_results?: number;
  enable_vector?: boolean;
  enable_web_verification?: boolean;
  include_ai_explanation?: boolean;
}

export interface AgentRecommendationNormalized {
  facility_id: string;
  name: string;
  city?: string | null;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  facility_type?: string | null;
  trust_score?: number | null;
  trust_category?: string | null;
  recommendation_readiness?: string | null;
  final_score?: number | null;
  reason_for_recommendation?: string | null;
  human_next_steps: string[];
  warning_flags: string[];
  evidence_summary?: string | null;
  score_breakdown?: Record<string, unknown> | null;
  raw_extra_fields: Record<string, unknown>;
}

export interface AgentEvidenceSnippet {
  facility_id?: string | null;
  facility_name?: string | null;
  source?: string | null;
  support_level?: string | null;
  capability?: string | null;
  excerpt?: string | null;
  url?: string | null;
  raw_extra_fields: Record<string, unknown>;
}

export interface AgentValidationFinding {
  severity?: string | null;
  finding_type?: string | null;
  rule?: string | null;
  message?: string | null;
  recommendation_impact?: string | null;
  raw_extra_fields: Record<string, unknown>;
}

export interface AgentVectorPanel {
  vector_enabled?: boolean;
  vector_available?: boolean;
  vector_count?: number | null;
  vector_reason?: string | null;
  vector_similarity_component?: number | null;
  vector_index?: string | null;
  vector_endpoint?: string | null;
}

export interface AgentWebVerificationPanel {
  web_checked?: boolean;
  web_available?: boolean;
  web_verification_enabled?: boolean;
  verification_status?: string | null;
  verification_score?: number | null;
  top_url?: string | null;
  top_snippet?: string | null;
  credits_estimated?: number | null;
  tavily_verified_count?: number | null;
}

export interface AgentTracePanel {
  retrieval_summary?: unknown;
  trace_summary?: unknown;
  request_timing_ms?: number | null;
}

export interface AgentNormalizedResponse {
  query: string;
  agent_mode?: string | null;
  model_used?: string | null;
  model_provider?: string | null;
  ai_summary?: string | null;
  ai_reasoning?: string | null;
  ai_answer?: string | null;
  ai_limitations?: string | null;
  ai_confidence?: number | string | null;
  ai_next_steps: string[];
  interpreted_intent: Record<string, unknown>;
  recommendations: AgentRecommendationNormalized[];
  evidence_snippets: AgentEvidenceSnippet[];
  validation_findings: AgentValidationFinding[];
  warning_flags: string[];
  score_breakdown?: Record<string, unknown> | null;
  safety_note?: string | null;
  human_next_steps: string[];
  fallback_message?: string | null;
  total_candidates?: number | null;
  returned?: number | null;
  vector: AgentVectorPanel;
  web_verification: AgentWebVerificationPanel;
  trace: AgentTracePanel;
  raw_extra_fields: Record<string, unknown>;
}

export interface AgentResponseEnvelope {
  raw: Record<string, unknown>;
  normalized: AgentNormalizedResponse;
}
