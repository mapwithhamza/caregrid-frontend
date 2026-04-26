export type TrustRiskLevel = "high-trust" | "moderate-trust" | "low-trust" | "high-risk" | "unknown";

export interface MapRegionMetric {
  state: string;
  total_facilities?: number | null;
  average_trust_score?: number | null;
  high_risk_percent?: number | null;
  ready_percent?: number | null;
  risk_level?: string | null;
}

export interface FacilityMapPoint {
  facility_id: string;
  name: string;
  state?: string | null;
  city?: string | null;
  latitude: number;
  longitude: number;
  facility_type?: string | null;
  trust_score?: number | null;
  trust_category?: string | null;
  recommendation_readiness?: string | null;
  final_score?: number | null;
  reason_for_recommendation?: string | null;
}
