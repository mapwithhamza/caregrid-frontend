export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  data_loaded: boolean;
  endpoints_ready?: boolean;
  tests_expected?: string;
  facility_rows?: number;
}

export interface FacilityListItem {
  facility_id: string;
  name: string;
  facility_type?: string | null;
  city?: string | null;
  state: string;
  pin_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  trust_score?: number | null;
  trust_category: string;
  recommendation_readiness: string;
  specialties?: string | null;
  evidence_summary?: string | null;
  flag_icu_claim_without_equipment?: boolean | null;
  flag_surgery_claim_without_support?: boolean | null;
  flag_dialysis_claim_without_machine?: boolean | null;
  flag_oncology_claim_without_support?: boolean | null;
}

export interface FacilityDetail extends FacilityListItem {
  phone?: string | null;
  email?: string | null;
  official_website?: string | null;
  websites?: string | null;
  procedures?: string | null;
  equipment?: string | null;
  capabilities_raw?: string | null;
  combined_medical_evidence?: string | null;
  evidence_length_chars?: number | null;
  v2_positive_score?: number | null;
  v2_total_penalty?: number | null;
  v2_identity_location_score?: number | null;
  v2_contact_verification_score?: number | null;
  v2_medical_evidence_score?: number | null;
  v2_digital_social_score?: number | null;
  v2_data_richness_score?: number | null;
  claims_emergency_or_high_acuity?: boolean | null;
  has_high_acuity_supporting_evidence?: boolean | null;
}

export interface PaginatedFacilitiesResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  results: FacilityListItem[];
}

export interface FacilityFiltersMeta {
  states: string[];
  facility_types: string[];
  trust_categories: string[];
  recommendation_readiness_values: string[];
}

export interface DashboardOverview {
  total_facilities?: number | null;
  states_covered?: number | null;
  average_trust_score?: number | null;
  high_trust_count?: number | null;
  moderate_trust_count?: number | null;
  low_trust_count?: number | null;
  high_risk_count?: number | null;
  ready_for_recommendation_count?: number | null;
  usable_with_verification_count?: number | null;
  do_not_recommend_count?: number | null;
}

export interface TrustDistributionItem {
  trust_category: string;
  facility_count?: number | null;
  percent_of_total?: number | null;
  avg_trust_score?: number | null;
}

export interface ReadinessDistributionItem {
  recommendation_readiness: string;
  facility_count?: number | null;
  percent_of_total?: number | null;
  avg_trust_score?: number | null;
}

export interface StateSummaryItem {
  state: string;
  total_facilities?: number | null;
  high_trust_facilities?: number | null;
  moderate_trust_facilities?: number | null;
  low_trust_facilities?: number | null;
  high_risk_facilities?: number | null;
  ready_for_recommendation?: number | null;
  avg_trust_score?: number | null;
  high_risk_percent?: number | null;
  ready_percent?: number | null;
  state_risk_level?: string | null;
}

export interface FacilityTypeSummaryItem {
  facility_type: string;
  facility_count?: number | null;
  avg_trust_score?: number | null;
  ready_for_recommendation?: number | null;
  high_risk_facilities?: number | null;
}

export interface TrustGapSummary {
  total_facilities?: number | null;
  states_covered?: number | null;
  average_trust_score?: number | null;
  high_trust_facilities?: number | null;
  moderate_trust_facilities?: number | null;
  low_trust_facilities?: number | null;
  high_risk_facilities?: number | null;
  ready_for_recommendation?: number | null;
  usable_with_verification?: number | null;
  do_not_recommend_without_review?: number | null;
  facilities_with_contradiction_flags?: number | null;
  facilities_with_high_acuity_claims?: number | null;
  unsupported_high_acuity_claims?: number | null;
  high_trust_percent?: number | null;
  high_risk_percent?: number | null;
  ready_percent?: number | null;
  do_not_recommend_percent?: number | null;
  contradiction_flag_percent?: number | null;
  unsupported_high_acuity_percent?: number | null;
  tier1_priority_states?: string | null;
  tier2_priority_states?: string | null;
  headline_insight?: string | null;
  planning_interpretation?: string | null;
}

export interface PriorityStateItem {
  national_priority_rank?: number | null;
  state: string;
  calibrated_priority_tier?: string | null;
  analysis_confidence?: string | null;
  risk_level?: string | null;
  overall_priority_score?: number | null;
  trust_desert_risk_index?: number | null;
  verification_burden_index?: number | null;
  verification_burden_count?: number | null;
  total_facilities?: number | null;
  avg_trust_score?: number | null;
  high_risk_facilities?: number | null;
  high_risk_percent?: number | null;
  low_trust_facilities?: number | null;
  do_not_recommend_facilities?: number | null;
  do_not_recommend_percent?: number | null;
  ready_facilities?: number | null;
  ready_percent?: number | null;
  unsupported_high_acuity_count?: number | null;
  unsupported_high_acuity_percent?: number | null;
  priority_reason?: string | null;
  [key: string]: unknown;
}

export interface StateRiskIndexItem {
  state: string;
  risk_level?: string | null;
  analysis_confidence?: string | null;
  trust_desert_risk_index?: number | null;
  total_facilities?: number | null;
  avg_trust_score?: number | null;
  high_risk_percent?: number | null;
  ready_percent?: number | null;
  do_not_recommend_percent?: number | null;
  unsupported_high_acuity_percent?: number | null;
  [key: string]: unknown;
}

export interface FacilityTypeGapItem {
  facility_type: string;
  facility_type_risk_level?: string | null;
  total_facilities?: number | null;
  avg_trust_score?: number | null;
  high_risk_percent?: number | null;
  ready_percent?: number | null;
  do_not_recommend_percent?: number | null;
  contradiction_percent?: number | null;
  [key: string]: unknown;
}

export interface SearchResultItem {
  facility_id: string;
  name: string;
  facility_type?: string | null;
  city?: string | null;
  state: string;
  latitude?: number | null;
  longitude?: number | null;
  trust_score?: number | null;
  trust_category: string;
  recommendation_readiness: string;
  specialties?: string | null;
  evidence_summary?: string | null;
  relevance_score: number;
  matched_fields: string[];
  warning_flags: string[];
}

export interface SearchResponse {
  query: string;
  total_matches: number;
  returned: number;
  results: SearchResultItem[];
  applied_filters: Record<string, string | number | null>;
}

export interface AgentRecommendRequest {
  query: string;
  state?: string | null;
  facility_type?: string | null;
  min_trust_score?: number | null;
  max_results?: number;
  enable_vector?: boolean;
  enable_web_verification?: boolean;
  include_ai_explanation?: boolean;
}

export interface AgentRecommendationItem {
  facility_id: string;
  name: string;
  facility_type?: string | null;
  city?: string | null;
  state: string;
  latitude?: number | null;
  longitude?: number | null;
  trust_score?: number | null;
  trust_category: string;
  recommendation_readiness: string;
  specialties?: string | null;
  evidence_summary?: string | null;
  matched_capabilities: string[];
  matched_fields: string[];
  warning_flags: string[];
  recommendation_score: number;
  reason_for_recommendation: string;
  [key: string]: unknown;
}

export interface AgentRecommendResponse {
  query: string;
  agent_mode?: string | null;
  model_used?: string | null;
  model_provider?: string | null;
  ai_summary?: string | null;
  ai_reasoning?: string | null;
  ai_answer?: string | null;
  ai_limitations?: string | null;
  ai_confidence?: number | string | null;
  ai_next_steps?: string[];
  retrieval_summary?: unknown;
  vector_enabled?: boolean;
  vector_available?: boolean;
  vector_count?: number | null;
  vector_reason?: string | null;
  web_verification_enabled?: boolean;
  tavily_verified_count?: number | null;
  evidence_snippets?: unknown[];
  validation_findings?: unknown[];
  warning_flags?: string[];
  score_breakdown?: Record<string, unknown> | null;
  human_next_steps?: string[];
  trace_summary?: unknown;
  raw_extra_fields?: Record<string, unknown>;
  interpreted_intent: Record<string, unknown>;
  total_candidates: number;
  returned: number;
  recommendations: AgentRecommendationItem[];
  reasoning: string;
  safety_note: string;
  fallback_message?: string | null;
  [key: string]: unknown;
}

export interface FacilitiesQueryParams {
  page?: number;
  limit?: number;
  state?: string;
  facility_type?: string;
  trust_category?: string;
  recommendation_readiness?: string;
  min_trust_score?: number;
  max_trust_score?: number;
}

export interface StateStatsQueryParams {
  sort_by?: "total_facilities" | "avg_trust_score" | "high_risk_percent" | "ready_percent" | "ready_for_recommendation";
  order?: "asc" | "desc";
  limit?: number;
}

export interface ImpactPriorityQueryParams {
  tier?: string;
  confidence?: string;
  limit?: number;
}

export interface ImpactStateRiskQueryParams {
  risk_level?: string;
  confidence?: string;
  sort_by?:
    | "trust_desert_risk_index"
    | "total_facilities"
    | "avg_trust_score"
    | "high_risk_percent"
    | "ready_percent"
    | "do_not_recommend_percent"
    | "unsupported_high_acuity_percent";
  order?: "asc" | "desc";
  limit?: number;
}

export interface ImpactFacilityTypeGapQueryParams {
  risk_level?: string;
  sort_by?:
    | "total_facilities"
    | "avg_trust_score"
    | "high_risk_percent"
    | "ready_percent"
    | "do_not_recommend_percent"
    | "contradiction_percent";
  order?: "asc" | "desc";
}

export interface SearchQueryParams {
  q: string;
  state?: string;
  facility_type?: string;
  trust_category?: string;
  recommendation_readiness?: string;
  min_trust_score?: number;
  limit?: number;
}
