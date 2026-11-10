import {
  cleanEmail,
  displayClass,
  displayName,
  firstValue,
  formatCoverage,
  formatMc,
  formatPhone,
  formatYmd,
  intOrNull,
  joinAddress,
  stripDot,
} from "@/lib/format";
import type { SocrataRow } from "@/lib/socrata";
import type { CarrierRecord, RunFilters, VehicleCounts } from "@/lib/types";

const CARGO_LABELS: Record<string, string> = {
  crgo_genfreight: "General freight",
  crgo_household: "Household goods",
  crgo_metalsheet: "Metal sheets, coils, rolls",
  crgo_motoveh: "Motor vehicles",
  crgo_logpole: "Logs, poles, beams, lumber",
  crgo_bldgmat: "Building materials",
  crgo_mobilehome: "Mobile homes",
  crgo_machlrg: "Machinery, large objects",
  crgo_produce: "Fresh produce",
  crgo_liqgas: "Liquids and gases",
  crgo_intermodal: "Intermodal containers",
  crgo_passengers: "Passengers",
  crgo_oilfield: "Oilfield equipment",
  crgo_livestock: "Livestock",
  crgo_grainfeed: "Grain, feed, hay",
  crgo_coalcoke: "Coal and coke",
  crgo_meat: "Meat",
  crgo_garbage: "Garbage, refuse, trash",
  crgo_usmail: "U.S. mail",
  crgo_chem: "Chemicals",
  crgo_drybulk: "Commodities dry bulk",
  crgo_coldfood: "Refrigerated food",
  crgo_beverages: "Beverages",
  crgo_paperprod: "Paper products",
  crgo_utility: "Utility",
  crgo_farmsupp: "Farm supplies",
  crgo_construct: "Construction",
  crgo_waterwell: "Water well",
};

const FLAG_NAME: Record<string, string> = {
  A: "Active",
  I: "Inactive",
  N: "None",
};

const CENSUS_STATUS: Record<string, string> = {
  A: "Active",
  I: "Inactive",
  P: "Pending",
  N: "Not authorized",
};

function flagLines(
  name: string,
  stat: string | undefined,
  application: string | undefined,
  revocation: string | undefined,
): string[] {
  const lines: string[] = [];
  if (stat && stat !== "N") lines.push(`${name} ${FLAG_NAME[stat] ?? stat}`);
  if (application === "Y") lines.push(`${name} application pending`);
  if (revocation === "Y") lines.push(`${name} revocation pending`);
  return lines;
}

export function authoritySummary(row: SocrataRow): { status: string; detail: string } {
  const stats = [row.common_stat, row.contract_stat, row.broker_stat];
  const applicationPending = [
    row.common_app_pend,
    row.contract_app_pend,
    row.broker_app_pend,
  ].includes("Y");
  const revocationPending = [
    row.common_rev_pend,
    row.contract_rev_pend,
    row.broker_rev_pend,
  ].includes("Y");

  let status = "None";
  if (stats.includes("A")) status = "Active";
  else if (applicationPending) status = "Pending";
  else if (revocationPending) status = "Revocation pending";
  else if (stats.includes("I")) status = "Inactive";

  const detail = [
    ...flagLines("Common", row.common_stat, row.common_app_pend, row.common_rev_pend),
    ...flagLines("Contract", row.contract_stat, row.contract_app_pend, row.contract_rev_pend),
    ...flagLines("Broker", row.broker_stat, row.broker_app_pend, row.broker_rev_pend),
  ].join(" · ");

  return {
    status,
    detail: detail || "No authority flags on the legacy row",
  };
}

function kindsOf(row: SocrataRow): string[] {
  const kinds: string[] = [];
  if (row.property_chk === "Y") kinds.push("Property");
  if (row.passenger_chk === "Y") kinds.push("Passenger");
  if (row.hhg_chk === "Y") kinds.push("Household goods");
  if (row.broker_stat && row.broker_stat !== "N") kinds.push("Broker");
  return kinds;
}

function onFileFlag(raw: string | undefined): string {
  if (raw === "Y") return "On file";
  if (raw === "N") return "Not on file";
  if (!raw) return "Not reported";
  return formatCoverage(raw);
}

function cargoOf(row: SocrataRow): string[] {
  const cargo: string[] = [];
  for (const [field, label] of Object.entries(CARGO_LABELS)) {
    if (row[field] === "X") cargo.push(label);
  }
  const other = displayName(row.crgo_cargoothr_desc);
  if (row.crgo_cargoothr === "X" && other) cargo.push(other);
  return cargo;
}

function vehiclesOf(row: SocrataRow): VehicleCounts {
  const count = (field: string) => intOrNull(row[field]) ?? 0;
  return {
    tractorsOwned: count("owntract"),
    tractorsTerm: count("trmtract"),
    tractorsTrip: count("trptract"),
    trucksOwned: count("owntruck"),
    trucksTerm: count("trmtruck"),
    trucksTrip: count("trptruck"),
    trailersOwned: count("owntrail"),
    trailersTerm: count("trmtrail"),
    trailersTrip: count("trptrail"),
  };
}

export function censusWhere(dotNumbers: string[]): string {
  const variants = new Set<string>();
  for (const dot of dotNumbers) {
    const stripped = stripDot(dot);
    if (!stripped) continue;
    variants.add(stripped);
    variants.add(stripped.padStart(8, "0"));
  }
  const list = [...variants].map((value) => `'${value}'`).join(",");
  return `dot_number in (${list})`;
}

export function mergeCarrier(legacy: SocrataRow, census: SocrataRow | undefined): CarrierRecord {
  const usdot = stripDot(legacy.dot_number);
  const authority = authoritySummary(legacy);
  const matched = Boolean(census);
  const phone = formatPhone(
    firstValue([census?.phone, census?.cell_phone, legacy.bus_telno, legacy.mail_telno]),
  );
  const physical = matched
    ? joinAddress([census?.phy_street, census?.phy_city, census?.phy_state, census?.phy_zip])
    : joinAddress([
        legacy.bus_street_po,
        legacy.bus_city,
        legacy.bus_state_code,
        legacy.bus_zip_code,
      ]);
  const mailing = matched
    ? joinAddress([
        census?.carrier_mailing_street,
        census?.carrier_mailing_city,
        census?.carrier_mailing_state,
        census?.carrier_mailing_zip,
      ])
    : joinAddress([
        legacy.mail_street_po,
        legacy.mail_city,
        legacy.mail_state_code,
        legacy.mail_zip_code,
      ]);

  return {
    legalName: displayName(firstValue([census?.legal_name, legacy.legal_name])) || "Unnamed carrier",
    dbaName: displayName(firstValue([census?.dba_name, legacy.dba_name])),
    mcNumber: formatMc(legacy.docket_number),
    usdot,
    authorityStatus: authority.status,
    authorityDetail: authority.detail,
    kinds: kindsOf(legacy),
    city: displayName(firstValue([census?.phy_city, legacy.bus_city])),
    state: (firstValue([census?.phy_state, legacy.bus_state_code]) || "").toUpperCase(),
    phone,
    fax: formatPhone(firstValue([legacy.bus_fax, legacy.mail_fax])),
    email: cleanEmail(census?.email_address),
    officer: displayName(census?.company_officer_1),
    powerUnits: matched ? intOrNull(census?.power_units) : null,
    truckUnits: matched ? intOrNull(census?.truck_units) : null,
    totalDrivers: matched ? intOrNull(census?.total_drivers) : null,
    cdlDrivers: matched ? intOrNull(census?.total_cdl) : null,
    interstateDrivers: matched ? intOrNull(census?.driver_inter_total) : null,
    intrastateDrivers: matched ? intOrNull(census?.total_intrastate_drivers) : null,
    vehicles: matched && census ? vehiclesOf(census) : null,
    cargo: matched && census ? cargoOf(census) : [],
    operation: displayClass(census?.classdef),
    censusStatus: census?.status_code
      ? (CENSUS_STATUS[census.status_code] ?? census.status_code)
      : "",
    addDate: formatYmd(census?.add_date),
    mcs150Date: formatYmd(census?.mcs150_date),
    physicalAddress: physical,
    mailingAddress: mailing,
    minCoverage: formatCoverage(legacy.min_cov_amount),
    bipdOnFile: formatCoverage(legacy.bipd_file),
    cargoOnFile: onFileFlag(legacy.cargo_file),
    bondOnFile: onFileFlag(legacy.bond_file),
    censusMatched: matched,
    motusUrl: /^\d+$/.test(usdot) ? `https://motus.dot.gov/customer/${usdot}/account` : "",
  };
}

export function dropReason(record: CarrierRecord, filters: RunFilters): string | null {
  if (filters.requirePhone && !record.phone) return "phone";
  if (filters.requireEmail && !record.email) return "email";
  if (
    filters.minPowerUnits != null &&
    (record.powerUnits == null || record.powerUnits < filters.minPowerUnits)
  ) {
    return "power";
  }
  if (
    filters.maxPowerUnits != null &&
    (record.powerUnits == null || record.powerUnits > filters.maxPowerUnits)
  ) {
    return "power";
  }
  if (filters.addedBeforeYear != null) {
    const year = Number(record.addDate.slice(0, 4));
    if (!record.addDate || !Number.isFinite(year) || year >= filters.addedBeforeYear) return "year";
  }
  return null;
}
