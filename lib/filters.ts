import type { AuthorityStatus, CarrierKind, RunFilters } from "@/lib/types";

export const DEFAULT_CAP = 250;
export const MAX_CAP = 2000;

export const PRESET_FILTERS: RunFilters = {
  state: "TX",
  status: "inactive",
  kind: "property",
  requirePhone: false,
  requireEmail: false,
  minPowerUnits: null,
  maxPowerUnits: null,
  addedBeforeYear: null,
  cap: DEFAULT_CAP,
};

export const US_STATES: { code: string; name: string }[] = [
  ["AL", "Alabama"],
  ["AK", "Alaska"],
  ["AZ", "Arizona"],
  ["AR", "Arkansas"],
  ["CA", "California"],
  ["CO", "Colorado"],
  ["CT", "Connecticut"],
  ["DE", "Delaware"],
  ["DC", "District of Columbia"],
  ["FL", "Florida"],
  ["GA", "Georgia"],
  ["HI", "Hawaii"],
  ["ID", "Idaho"],
  ["IL", "Illinois"],
  ["IN", "Indiana"],
  ["IA", "Iowa"],
  ["KS", "Kansas"],
  ["KY", "Kentucky"],
  ["LA", "Louisiana"],
  ["ME", "Maine"],
  ["MD", "Maryland"],
  ["MA", "Massachusetts"],
  ["MI", "Michigan"],
  ["MN", "Minnesota"],
  ["MS", "Mississippi"],
  ["MO", "Missouri"],
  ["MT", "Montana"],
  ["NE", "Nebraska"],
  ["NV", "Nevada"],
  ["NH", "New Hampshire"],
  ["NJ", "New Jersey"],
  ["NM", "New Mexico"],
  ["NY", "New York"],
  ["NC", "North Carolina"],
  ["ND", "North Dakota"],
  ["OH", "Ohio"],
  ["OK", "Oklahoma"],
  ["OR", "Oregon"],
  ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"],
  ["SC", "South Carolina"],
  ["SD", "South Dakota"],
  ["TN", "Tennessee"],
  ["TX", "Texas"],
  ["UT", "Utah"],
  ["VT", "Vermont"],
  ["VA", "Virginia"],
  ["WA", "Washington"],
  ["WV", "West Virginia"],
  ["WI", "Wisconsin"],
  ["WY", "Wyoming"],
].map(([code, name]) => ({ code, name }));

const STATUSES = new Set<AuthorityStatus>([
  "inactive",
  "active",
  "pending",
  "revocation_pending",
  "any",
]);

const KINDS = new Set<CarrierKind>([
  "property",
  "passenger",
  "household",
  "broker",
  "any",
]);

const STATE_CODES = new Set(US_STATES.map((state) => state.code));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalInt(
  value: unknown,
  label: string,
  min: number,
  max: number,
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (value == null || value === "") return { ok: true, value: null };
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    return { ok: false, error: `${label} must be a whole number from ${min} to ${max}.` };
  }
  return { ok: true, value: number };
}

export function parseFilters(
  input: unknown,
): { ok: true; filters: RunFilters } | { ok: false; error: string } {
  if (!isRecord(input)) {
    return { ok: false, error: "Send the search filters as JSON." };
  }

  const state = typeof input.state === "string" ? input.state.trim().toUpperCase() : "";
  if (state && !STATE_CODES.has(state)) {
    return { ok: false, error: "Pick a U.S. state or leave the state open." };
  }

  const status = input.status;
  if (typeof status !== "string" || !STATUSES.has(status as AuthorityStatus)) {
    return { ok: false, error: "Pick an authority status." };
  }

  const kind = input.kind ?? "any";
  if (typeof kind !== "string" || !KINDS.has(kind as CarrierKind)) {
    return { ok: false, error: "Pick a carrier kind." };
  }

  if (!state && status === "any") {
    return {
      ok: false,
      error: "Choose a state or an authority status. An open national search is too large for one run.",
    };
  }

  const minPower = optionalInt(input.minPowerUnits, "Minimum power units", 0, 100000);
  if (!minPower.ok) return minPower;
  const maxPower = optionalInt(input.maxPowerUnits, "Maximum power units", 0, 100000);
  if (!maxPower.ok) return maxPower;
  if (
    minPower.value != null &&
    maxPower.value != null &&
    minPower.value > maxPower.value
  ) {
    return { ok: false, error: "Minimum power units cannot be higher than the maximum." };
  }

  const year = optionalInt(input.addedBeforeYear, "Added before", 1970, 2026);
  if (!year.ok) return year;

  const capResult = optionalInt(input.cap ?? DEFAULT_CAP, "Result cap", 1, MAX_CAP);
  if (!capResult.ok) return capResult;

  return {
    ok: true,
    filters: {
      state,
      status: status as AuthorityStatus,
      kind: kind as CarrierKind,
      requirePhone: input.requirePhone === true,
      requireEmail: input.requireEmail === true,
      minPowerUnits: minPower.value,
      maxPowerUnits: maxPower.value,
      addedBeforeYear: year.value,
      cap: capResult.value ?? DEFAULT_CAP,
    },
  };
}

export function buildLegacyWhere(filters: RunFilters): string {
  const parts = ["starts_with(docket_number, 'MC')"];
  if (filters.state) parts.push(`bus_state_code = '${filters.state}'`);

  if (filters.kind === "property") parts.push("property_chk = 'Y'");
  if (filters.kind === "passenger") parts.push("passenger_chk = 'Y'");
  if (filters.kind === "household") parts.push("hhg_chk = 'Y'");
  if (filters.kind === "broker") parts.push("broker_stat != 'N'");

  if (filters.status === "active") {
    parts.push("(common_stat = 'A' OR contract_stat = 'A' OR broker_stat = 'A')");
  } else if (filters.status === "inactive") {
    parts.push(
      "common_stat != 'A' AND contract_stat != 'A' AND broker_stat != 'A' AND (common_stat = 'I' OR contract_stat = 'I' OR broker_stat = 'I')",
    );
  } else if (filters.status === "pending") {
    parts.push("(common_app_pend = 'Y' OR contract_app_pend = 'Y' OR broker_app_pend = 'Y')");
  } else if (filters.status === "revocation_pending") {
    parts.push("(common_rev_pend = 'Y' OR contract_rev_pend = 'Y' OR broker_rev_pend = 'Y')");
  }

  return parts.join(" AND ");
}

export function needsCensusFilter(filters: RunFilters): boolean {
  return (
    filters.requirePhone ||
    filters.requireEmail ||
    filters.minPowerUnits != null ||
    filters.maxPowerUnits != null ||
    filters.addedBeforeYear != null
  );
}
