import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getFacilities,
  getFacilityById,
  getFacilityFilters
} from "../../api/caregridApi";
import type {
  FacilitiesQueryParams,
  FacilityDetail,
  FacilityFiltersMeta,
  FacilityListItem,
  PaginatedFacilitiesResponse
} from "../../api/types";
import { Badge } from "../common/Badge";
import { ErrorState } from "../common/ErrorState";
import { LoadingState } from "../common/LoadingState";
import { FacilityCard } from "./FacilityCard";
import { FacilityDetailDrawer } from "./FacilityDetailDrawer";
import { FacilityFilters } from "./FacilityFilters";

const DEFAULT_LIMIT = 25;

function displayNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-IN").format(value);
}

function matchesQuickFilter(facility: FacilityListItem, query: string): boolean {
  if (!query.trim()) {
    return true;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const searchableText = [
    facility.name,
    facility.city,
    facility.state,
    facility.facility_type,
    facility.specialties
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
}

export function FacilitiesPage() {
  const [filtersMeta, setFiltersMeta] = useState<FacilityFiltersMeta | null>(null);
  const [facilitiesResponse, setFacilitiesResponse] =
    useState<PaginatedFacilitiesResponse | null>(null);
  const [draftFilters, setDraftFilters] = useState<FacilitiesQueryParams>({});
  const [appliedFilters, setAppliedFilters] = useState<FacilitiesQueryParams>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [quickFilter, setQuickFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<FacilityDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailErrorMessage, setDetailErrorMessage] = useState<string | null>(null);

  const loadFacilities = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [meta, facilities] = await Promise.all([
        filtersMeta ? Promise.resolve(filtersMeta) : getFacilityFilters(),
        getFacilities({
          ...appliedFilters,
          page,
          limit
        })
      ]);

      setFiltersMeta(meta);
      setFacilitiesResponse(facilities);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load facilities."
      );
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters, filtersMeta, limit, page]);

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

  useEffect(() => {
    void loadFacilities();
  }, [loadFacilities]);

  const visibleFacilities = useMemo(
    () =>
      facilitiesResponse?.results.filter((facility) =>
        matchesQuickFilter(facility, quickFilter)
      ) ?? [],
    [facilitiesResponse, quickFilter]
  );

  function applyFilters() {
    setAppliedFilters(draftFilters);
    setPage(1);
    setQuickFilter("");
  }

  function resetFilters() {
    setDraftFilters({});
    setAppliedFilters({});
    setPage(1);
    setQuickFilter("");
  }

  function closeDrawer() {
    setSelectedFacilityId(null);
    setSelectedFacility(null);
    setDetailErrorMessage(null);
  }

  if (isLoading && !facilitiesResponse) {
    return <LoadingState label="Loading live facilities from CareGrid API..." />;
  }

  if (errorMessage && !facilitiesResponse) {
    return (
      <ErrorState
        title="Facilities unavailable"
        message={errorMessage}
        onRetry={loadFacilities}
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success">Live API</Badge>
            <Badge variant="info">10,000 records</Badge>
            <Badge variant="default">Evidence-backed</Badge>
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
            Facilities Explorer
          </h2>
          <p className="mt-3 max-w-3xl text-slate-600">
            Browse, filter, and inspect healthcare facilities using trust scores,
            readiness labels, and evidence flags.
          </p>
        </div>
        {facilitiesResponse ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            Total matched:{" "}
            <span className="font-bold text-slate-950">
              {displayNumber(facilitiesResponse.total)}
            </span>
          </div>
        ) : null}
      </div>

      <FacilityFilters
        filtersMeta={filtersMeta}
        draftFilters={draftFilters}
        onDraftChange={setDraftFilters}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      {errorMessage ? (
        <ErrorState
          title="Could not refresh facilities"
          message={errorMessage}
          onRetry={loadFacilities}
        />
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="w-full max-w-xl space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Quick filter visible results
            </span>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              placeholder="Filter current page by name, city, state, type, or specialties"
              type="search"
              value={quickFilter}
              onChange={(event) => setQuickFilter(event.target.value)}
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              Limit
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                value={limit}
                onChange={(event) => {
                  setLimit(Number(event.target.value));
                  setPage(1);
                }}
              >
                {[10, 25, 50, 100].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              disabled={!facilitiesResponse || page <= 1 || isLoading}
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
            >
              Previous
            </button>
            <span className="text-sm font-medium text-slate-600">
              Page {facilitiesResponse?.page ?? page} of{" "}
              {facilitiesResponse?.total_pages ?? "—"}
            </span>
            <button
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              disabled={
                !facilitiesResponse ||
                page >= facilitiesResponse.total_pages ||
                isLoading
              }
              onClick={() => setPage((currentPage) => currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {isLoading ? <LoadingState label="Refreshing facilities..." /> : null}

      {!isLoading && facilitiesResponse && visibleFacilities.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h3 className="text-xl font-bold text-slate-950">
            No facilities matched these filters.
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Try resetting filters or adjusting the quick visible-results filter.
          </p>
          <button
            className="mt-5 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            type="button"
            onClick={resetFilters}
          >
            Reset filters
          </button>
        </div>
      ) : null}

      <div className="space-y-4">
        {visibleFacilities.map((facility) => (
          <FacilityCard
            key={facility.facility_id}
            facility={facility}
            onViewDetails={loadFacilityDetail}
          />
        ))}
      </div>

      {facilitiesResponse ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          Showing {displayNumber(visibleFacilities.length)} visible result(s) from page{" "}
          {facilitiesResponse.page}. Backend total for current filters:{" "}
          <span className="font-bold text-slate-950">
            {displayNumber(facilitiesResponse.total)}
          </span>
          .
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
