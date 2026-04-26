import { Eye, MapPin } from "lucide-react";

import type { FacilityListItem } from "../../api/types";
import { Badge } from "../common/Badge";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

interface FacilityCardProps {
  facility: FacilityListItem;
  onViewDetails: (facilityId: string) => void;
}

function displayValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
}

function truncateText(value: string | null | undefined, maxLength: number): string {
  if (!value) {
    return "—";
  }

  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

export function getTrustBadgeVariant(trustCategory: string): BadgeVariant {
  if (trustCategory === "High Trust / Evidence Supported") {
    return "success";
  }
  if (trustCategory === "Moderate Trust / Verify Before Use") {
    return "info";
  }
  if (trustCategory === "Low Trust / Needs Human Verification") {
    return "warning";
  }
  if (trustCategory === "High Risk / Insufficient Evidence") {
    return "danger";
  }
  return "default";
}

export function getReadinessBadgeVariant(readiness: string): BadgeVariant {
  if (readiness === "Ready for recommendation") {
    return "success";
  }
  if (readiness === "Usable with verification") {
    return "warning";
  }
  if (readiness === "Do not recommend without human review") {
    return "danger";
  }
  return "default";
}

export function getFacilityWarningBadges(facility: FacilityListItem): string[] {
  const warnings: string[] = [];

  if (facility.flag_icu_claim_without_equipment) {
    warnings.push("ICU evidence warning");
  }
  if (facility.flag_surgery_claim_without_support) {
    warnings.push("Surgery evidence warning");
  }
  if (facility.flag_dialysis_claim_without_machine) {
    warnings.push("Dialysis evidence warning");
  }
  if (facility.flag_oncology_claim_without_support) {
    warnings.push("Oncology evidence warning");
  }
  if (facility.recommendation_readiness === "Do not recommend without human review") {
    warnings.push("Human review required");
  }

  return warnings;
}

export function FacilityCard({ facility, onViewDetails }: FacilityCardProps) {
  const warnings = getFacilityWarningBadges(facility);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">{displayValue(facility.facility_type)}</Badge>
            <Badge variant={getTrustBadgeVariant(facility.trust_category)}>
              {facility.trust_category}
            </Badge>
            <Badge variant={getReadinessBadgeVariant(facility.recommendation_readiness)}>
              {facility.recommendation_readiness}
            </Badge>
          </div>

          <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-950">
            {facility.name}
          </h3>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <MapPin className="h-4 w-4 text-teal-600" />
            <span>
              {displayValue(facility.city)}, {facility.state}
            </span>
            <span className="text-slate-300">•</span>
            <span>PIN {displayValue(facility.pin_code)}</span>
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Trust score
              </p>
              <p className="mt-1 text-lg font-bold text-slate-950">
                {displayValue(facility.trust_score)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Specialties
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {truncateText(facility.specialties, 130)}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-600">
            {truncateText(facility.evidence_summary, 220)}
          </p>

          {warnings.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {warnings.map((warning) => (
                <Badge key={warning} variant="danger">
                  {warning}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          type="button"
          onClick={() => onViewDetails(facility.facility_id)}
        >
          <Eye className="h-4 w-4" />
          View details
        </button>
      </div>
    </article>
  );
}
