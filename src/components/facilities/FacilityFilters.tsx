import type { FacilitiesQueryParams, FacilityFiltersMeta } from "../../api/types";

interface FacilityFiltersProps {
  filtersMeta: FacilityFiltersMeta | null;
  draftFilters: FacilitiesQueryParams;
  onDraftChange: (filters: FacilitiesQueryParams) => void;
  onApply: () => void;
  onReset: () => void;
}

function numberValue(value: number | undefined): string {
  return value === undefined ? "" : String(value);
}

function updateStringFilter(
  filters: FacilitiesQueryParams,
  key: keyof FacilitiesQueryParams,
  value: string
): FacilitiesQueryParams {
  return {
    ...filters,
    [key]: value || undefined
  };
}

function updateNumberFilter(
  filters: FacilitiesQueryParams,
  key: "min_trust_score" | "max_trust_score",
  value: string
): FacilitiesQueryParams {
  return {
    ...filters,
    [key]: value === "" ? undefined : Number(value)
  };
}

export function FacilityFilters({
  filtersMeta,
  draftFilters,
  onDraftChange,
  onApply,
  onReset
}: FacilityFiltersProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Filters</h3>
          <p className="text-sm text-slate-500">
            Use exact backend filter values from the metadata endpoint.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            type="button"
            onClick={onReset}
          >
            Reset
          </button>
          <button
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            type="button"
            onClick={onApply}
          >
            Apply filters
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">State</span>
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            value={draftFilters.state ?? ""}
            onChange={(event) =>
              onDraftChange(updateStringFilter(draftFilters, "state", event.target.value))
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
            value={draftFilters.facility_type ?? ""}
            onChange={(event) =>
              onDraftChange(
                updateStringFilter(draftFilters, "facility_type", event.target.value)
              )
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
            value={draftFilters.trust_category ?? ""}
            onChange={(event) =>
              onDraftChange(
                updateStringFilter(draftFilters, "trust_category", event.target.value)
              )
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
            value={draftFilters.recommendation_readiness ?? ""}
            onChange={(event) =>
              onDraftChange(
                updateStringFilter(
                  draftFilters,
                  "recommendation_readiness",
                  event.target.value
                )
              )
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
            max={100}
            min={0}
            placeholder="0"
            type="number"
            value={numberValue(draftFilters.min_trust_score)}
            onChange={(event) =>
              onDraftChange(
                updateNumberFilter(draftFilters, "min_trust_score", event.target.value)
              )
            }
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Max trust score</span>
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            max={100}
            min={0}
            placeholder="100"
            type="number"
            value={numberValue(draftFilters.max_trust_score)}
            onChange={(event) =>
              onDraftChange(
                updateNumberFilter(draftFilters, "max_trust_score", event.target.value)
              )
            }
          />
        </label>
      </div>
    </div>
  );
}
