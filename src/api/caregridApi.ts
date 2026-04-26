import axios from "axios";

import { apiClient } from "./client";
import {
  buildAgentRecommendPayload,
  buildLegacyAgentRecommendPayload,
  normalizeAgentResponse
} from "./agentAdapter";
import {
  AGENT_RECOMMEND,
  FACILITIES,
  FACILITY_FILTERS,
  HEALTH,
  IMPACT_FACILITY_TYPE_GAP,
  IMPACT_PRIORITY_STATES,
  IMPACT_STATE_RISK_INDEX,
  IMPACT_TRUST_GAP_SUMMARY,
  SEARCH,
  STATS_FACILITY_TYPES,
  STATS_OVERVIEW,
  STATS_READINESS_DISTRIBUTION,
  STATS_STATES,
  STATS_TRUST_DISTRIBUTION
} from "./endpoints";
import type {
  AgentRecommendRequest,
  AgentRecommendResponse,
  DashboardOverview,
  FacilitiesQueryParams,
  FacilityDetail,
  FacilityFiltersMeta,
  FacilityTypeGapItem,
  ImpactFacilityTypeGapQueryParams,
  FacilityTypeSummaryItem,
  HealthResponse,
  ImpactPriorityQueryParams,
  ImpactStateRiskQueryParams,
  PaginatedFacilitiesResponse,
  PriorityStateItem,
  ReadinessDistributionItem,
  SearchQueryParams,
  SearchResponse,
  StateRiskIndexItem,
  StateStatsQueryParams,
  StateSummaryItem,
  TrustDistributionItem,
  TrustGapSummary
} from "./types";
import type { AgentNormalizedResponse, AgentPageRequest } from "../types/agent";

export async function getHealth(): Promise<HealthResponse> {
  const response = await apiClient.get<HealthResponse>(HEALTH);
  return response.data;
}

export async function getFacilities(
  params?: FacilitiesQueryParams
): Promise<PaginatedFacilitiesResponse> {
  const response = await apiClient.get<PaginatedFacilitiesResponse>(FACILITIES, {
    params
  });
  return response.data;
}

export async function getFacilityById(facilityId: string): Promise<FacilityDetail> {
  const response = await apiClient.get<FacilityDetail>(`${FACILITIES}/${facilityId}`);
  return response.data;
}

export async function getFacilityFilters(): Promise<FacilityFiltersMeta> {
  const response = await apiClient.get<FacilityFiltersMeta>(FACILITY_FILTERS);
  return response.data;
}

export async function getStatsOverview(): Promise<DashboardOverview> {
  const response = await apiClient.get<DashboardOverview>(STATS_OVERVIEW);
  return response.data;
}

export async function getTrustDistribution(): Promise<TrustDistributionItem[]> {
  const response = await apiClient.get<TrustDistributionItem[]>(STATS_TRUST_DISTRIBUTION);
  return response.data;
}

export async function getReadinessDistribution(): Promise<ReadinessDistributionItem[]> {
  const response = await apiClient.get<ReadinessDistributionItem[]>(
    STATS_READINESS_DISTRIBUTION
  );
  return response.data;
}

export async function getStateSummaries(
  params?: StateStatsQueryParams
): Promise<StateSummaryItem[]> {
  const response = await apiClient.get<StateSummaryItem[]>(STATS_STATES, { params });
  return response.data;
}

export async function getFacilityTypeSummaries(): Promise<FacilityTypeSummaryItem[]> {
  const response = await apiClient.get<FacilityTypeSummaryItem[]>(STATS_FACILITY_TYPES);
  return response.data;
}

export async function getTrustGapSummary(): Promise<TrustGapSummary> {
  const response = await apiClient.get<TrustGapSummary>(IMPACT_TRUST_GAP_SUMMARY);
  return response.data;
}

export async function getPriorityStates(
  params?: ImpactPriorityQueryParams
): Promise<PriorityStateItem[]> {
  const response = await apiClient.get<PriorityStateItem[]>(IMPACT_PRIORITY_STATES, {
    params
  });
  return response.data;
}

export async function getStateRiskIndex(
  params?: ImpactStateRiskQueryParams
): Promise<StateRiskIndexItem[]> {
  const response = await apiClient.get<StateRiskIndexItem[]>(IMPACT_STATE_RISK_INDEX, {
    params
  });
  return response.data;
}

export async function getFacilityTypeGap(
  params?: ImpactFacilityTypeGapQueryParams
): Promise<FacilityTypeGapItem[]> {
  const response = await apiClient.get<FacilityTypeGapItem[]>(IMPACT_FACILITY_TYPE_GAP, {
    params
  });
  return response.data;
}

export async function searchFacilities(params: SearchQueryParams): Promise<SearchResponse> {
  const response = await apiClient.get<SearchResponse>(SEARCH, { params });
  return response.data;
}

export async function recommendFacilities(
  body: AgentRecommendRequest
): Promise<AgentRecommendResponse> {
  const response = await apiClient.post<AgentRecommendResponse>(AGENT_RECOMMEND, body);
  return response.data;
}

export async function recommendFacilitiesAiReady(
  body: AgentPageRequest
): Promise<AgentNormalizedResponse> {
  const startedAt = Date.now();

  try {
    const response = await apiClient.post<AgentRecommendResponse>(
      AGENT_RECOMMEND,
      buildAgentRecommendPayload(body),
      {
        timeout: 30000
      }
    );

    return normalizeAgentResponse(response.data, Date.now() - startedAt);
  } catch (error) {
    if (axios.isAxiosError(error) && [400, 422].includes(error.response?.status ?? 0)) {
      const legacyResponse = await apiClient.post<AgentRecommendResponse>(
        AGENT_RECOMMEND,
        buildLegacyAgentRecommendPayload(body),
        {
          timeout: 30000
        }
      );

      return normalizeAgentResponse(legacyResponse.data, Date.now() - startedAt);
    }

    throw error;
  }
}
