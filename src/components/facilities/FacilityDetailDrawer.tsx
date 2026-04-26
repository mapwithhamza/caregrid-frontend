import { X } from "lucide-react";

import type { FacilityDetail } from "../../api/types";
import { Badge } from "../common/Badge";
import { ErrorState } from "../common/ErrorState";
import { LoadingState } from "../common/LoadingState";
import {
  getFacilityWarningBadges,
  getReadinessBadgeVariant,
  getTrustBadgeVariant
} from "./FacilityCard";

interface FacilityDetailDrawerProps {
  facility: FacilityDetail | null;
  isLoading: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onRetry: () => void;
}

function displayValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
}

function DetailRow({
  label,
  value
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-800">{displayValue(value)}</p>
    </div>
  );
}

function TextBlock({
  label,
  value
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 max-h-44 overflow-y-auto text-sm leading-6 text-slate-700">
        {displayValue(value)}
      </p>
    </div>
  );
}

export function FacilityDetailDrawer({
  facility,
  isLoading,
  errorMessage,
  onClose,
  onRetry
}: FacilityDetailDrawerProps) {
  const warnings = facility ? getFacilityWarningBadges(facility) : [];

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close facility details"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        type="button"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
              Facility details
            </p>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              {facility?.name ?? "Loading facility..."}
            </h3>
          </div>
          <button
            className="rounded-2xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
            type="button"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? <LoadingState label="Loading facility detail..." /> : null}
          {errorMessage ? (
            <ErrorState
              title="Facility detail unavailable"
              message={errorMessage}
              onRetry={onRetry}
            />
          ) : null}
          {facility && !isLoading && !errorMessage ? (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">{displayValue(facility.facility_type)}</Badge>
                <Badge variant={getTrustBadgeVariant(facility.trust_category)}>
                  {facility.trust_category}
                </Badge>
                <Badge variant={getReadinessBadgeVariant(facility.recommendation_readiness)}>
                  {facility.recommendation_readiness}
                </Badge>
              </div>

              {warnings.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {warnings.map((warning) => (
                    <Badge key={warning} variant="danger">
                      {warning}
                    </Badge>
                  ))}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <DetailRow label="City" value={facility.city} />
                <DetailRow label="State" value={facility.state} />
                <DetailRow label="PIN code" value={facility.pin_code} />
                <DetailRow label="Latitude / Longitude" value={`${displayValue(facility.latitude)} / ${displayValue(facility.longitude)}`} />
                <DetailRow label="Phone" value={facility.phone} />
                <DetailRow label="Email" value={facility.email} />
                <DetailRow label="Official website" value={facility.official_website} />
                <DetailRow label="Websites" value={facility.websites} />
                <DetailRow label="Trust score" value={facility.trust_score} />
              </div>

              <div className="grid gap-4">
                <TextBlock label="Specialties" value={facility.specialties} />
                <TextBlock label="Procedures" value={facility.procedures} />
                <TextBlock label="Equipment" value={facility.equipment} />
                <TextBlock label="Capabilities raw" value={facility.capabilities_raw} />
                <TextBlock label="Evidence summary" value={facility.evidence_summary} />
                <TextBlock
                  label="Combined medical evidence"
                  value={facility.combined_medical_evidence}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Score breakdown
                </h4>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <DetailRow
                    label="Identity/location"
                    value={facility.v2_identity_location_score}
                  />
                  <DetailRow
                    label="Contact verification"
                    value={facility.v2_contact_verification_score}
                  />
                  <DetailRow
                    label="Medical evidence"
                    value={facility.v2_medical_evidence_score}
                  />
                  <DetailRow
                    label="Digital/social"
                    value={facility.v2_digital_social_score}
                  />
                  <DetailRow
                    label="Data richness"
                    value={facility.v2_data_richness_score}
                  />
                  <DetailRow label="Positive score" value={facility.v2_positive_score} />
                  <DetailRow label="Total penalty" value={facility.v2_total_penalty} />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
