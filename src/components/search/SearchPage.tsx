import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getFacilityById,
  getFacilityFilters,
  searchFacilities
} from "../../api/caregridApi";
import type {
  FacilityDetail,
  FacilityFiltersMeta,
  SearchQueryParams,
  SearchResponse,
  SearchResultItem
} from "../../api/types";
import { Badge } from "../common/Badge";
import { ErrorState } from "../common/ErrorState";
import { FacilityDetailDrawer } from "../facilities/FacilityDetailDrawer";

function displayNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }

  return new Intl.NumberFormat("en-IN").format(value);
}

function displayValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return value.toFixed(2);
}

function trimOrUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function toOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === "") {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

interface SearchFormState {
  q: string;
  state: string;
  facility_type: string;
  trust_category: string;
  recommendation_readiness: string;
  min_trust_score: string;
  limit: string;
}

const initialFormState: SearchFormState = {
  q: "",
  state: "",
  facility_type: "",
  trust_category: "",
  recommendation_readiness: "",
  min_trust_score: "",
  limit: "20"
};

function SearchResultCard({
  result,
  onViewDetails
}: {
  result: SearchResultItem;
  onViewDetails: (facilityId: string) => void;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">{displayValue(result.facility_type)}</Badge>
            <Badge variant="info">Relevance {formatScore(result.relevance_score)}</Badge>
            <Badge variant="success">{result.trust_category}</Badge>
            <Badge variant="warning">{result.recommendation_readiness}</Badge>
          </div>

          <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-950">{result.name}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {displayValue(result.city)}, {result.state}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            {displayValue(result.evidence_summary)}
          </p>

          {result.matched_fields.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {result.matched_fields.map((field) => (
                <Badge key={`${result.facility_id}-field-${field}`} variant="info">
                  matched: {field}
                </Badge>
              ))}
            </div>
          ) : null}

          {result.warning_flags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {result.warning_flags.map((warning) => (
                <Badge key={`${result.facility_id}-warning-${warning}`} variant="danger">
                  {warning}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <button
          className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          type="button"
          onClick={() => onViewDetails(result.facility_id)}
        >
          View details
        </button>
      </div>
    </article>
  );
}

export function SearchPage() {
  const [filtersMeta, setFiltersMeta] = useState<FacilityFiltersMeta | null>(null);
  const [formState, setFormState] = useState<SearchFormState>(initialFormState);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<FacilityDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailErrorMessage, setDetailErrorMessage] = useState<string | null>(null);

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

  const requestParams = useMemo((): SearchQueryParams | null => {
    const q = formState.q.trim();
    if (!q) {
      return null;
    }

    return {
      q,
      state: trimOrUndefined(formState.state),
      facility_type: trimOrUndefined(formState.facility_type),
      trust_category: trimOrUndefined(formState.trust_category),
      recommendation_readiness: trimOrUndefined(formState.recommendation_readiness),
      min_trust_score: toOptionalNumber(formState.min_trust_score),
      limit: toOptionalNumber(formState.limit)
    };
  }, [formState]);

  async function runSearch() {
    if (!requestParams) {
      setSearchError("Enter a search query before searching.");
      setResults(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await searchFacilities(requestParams);
      setResults(response);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Search request failed.");
      setResults(null);
    } finally {
      setIsSearching(false);
    }
  }

  const loadFacilityDetail = useCallback(async (facilityId: string) => {
    setSelectedFacilityId(facilityId);
    setSelectedFacility(null);
    setIsDetailLoading(true);
    setDetailErrorMessage(null);

    try {
      const detail = await getFacilityById(facilityId);
      setSelectedFacility(detail);
    } catch (error) {
      setDetailErrorMessage(
        error instanceof Error ? error.message : "Unable to load facility detail."
      );
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  function closeDrawer() {
    setSelectedFacilityId(null);
    setSelectedFacility(null);
    setDetailErrorMessage(null);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success">Live API</Badge>
            <Badge variant="info">GET /search</Badge>
            <Badge variant="default">Evidence-aware ranking</Badge>
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">Search</h2>
          <p className="mt-3 max-w-3xl text-slate-600">
            Search facilities by real backend-indexed fields and inspect matched fields,
            relevance, and warning flags.
          </p>
        </div>
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
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              placeholder="e.g. ICU emergency support in Maharashtra"
              type="search"
              value={formState.q}
              onChange={(event) =>
                setFormState((current) => ({ ...current, q: event.target.value }))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void runSearch();
                }
              }}
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
              <option value="">All states</option>
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
              <option value="">All facility types</option>
              {filtersMeta?.facility_types.map((facilityType) => (
                <option key={facilityType} value={facilityType}>
                  {facilityType}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Trust category</span>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              value={formState.trust_category}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  trust_category: event.target.value
                }))
              }
            >
              <option value="">All trust categories</option>
              {filtersMeta?.trust_categories.map((trustCategory) => (
                <option key={trustCategory} value={trustCategory}>
                  {trustCategory}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Recommendation readiness
            </span>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              value={formState.recommendation_readiness}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  recommendation_readiness: event.target.value
                }))
              }
            >
              <option value="">All readiness labels</option>
              {filtersMeta?.recommendation_readiness_values.map((readiness) => (
                <option key={readiness} value={readiness}>
                  {readiness}
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
              placeholder="0"
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
            <span className="text-sm font-semibold text-slate-700">Limit</span>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              min={1}
              max={100}
              placeholder="20"
              type="number"
              value={formState.limit}
              onChange={(event) =>
                setFormState((current) => ({ ...current, limit: event.target.value }))
              }
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={isSearching}
            onClick={() => void runSearch()}
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
          <button
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            type="button"
            onClick={() => {
              setFormState(initialFormState);
              setResults(null);
              setSearchError(null);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {searchError ? (
        <ErrorState
          title="Search request failed"
          message={searchError}
          onRetry={() => void runSearch()}
        />
      ) : null}

      {results ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          Query <span className="font-semibold text-slate-900">{results.query}</span> matched{" "}
          <span className="font-semibold text-slate-900">
            {displayNumber(results.total_matches)}
          </span>{" "}
          facilities; returning {displayNumber(results.returned)}.
        </div>
      ) : null}

      <div className="space-y-4">
        {results?.results.map((result) => (
          <SearchResultCard
            key={result.facility_id}
            result={result}
            onViewDetails={loadFacilityDetail}
          />
        ))}
      </div>

      {results && results.results.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h3 className="text-xl font-bold text-slate-950">No results found.</h3>
          <p className="mt-2 text-sm text-slate-500">
            Try a broader query or remove one or more filters.
          </p>
        </div>
      ) : null}

      {selectedFacilityId ? (
        <FacilityDetailDrawer
          facility={selectedFacility}
          isLoading={isDetailLoading}
          errorMessage={detailErrorMessage}
          onClose={closeDrawer}
          onRetry={() => void loadFacilityDetail(selectedFacilityId)}
        />
      ) : null}
    </section>
  );
}
