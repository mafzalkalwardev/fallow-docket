import type { CarrierRecord } from "@/lib/types";

const COLUMNS: { header: string; value: (record: CarrierRecord) => string | number | null }[] = [
  { header: "legal_name", value: (record) => record.legalName },
  { header: "dba_name", value: (record) => record.dbaName },
  { header: "mc", value: (record) => record.mcNumber },
  { header: "usdot", value: (record) => record.usdot },
  { header: "authority_status", value: (record) => record.authorityStatus },
  { header: "authority_detail", value: (record) => record.authorityDetail },
  { header: "kinds", value: (record) => record.kinds.join("; ") },
  { header: "city", value: (record) => record.city },
  { header: "state", value: (record) => record.state },
  { header: "phone", value: (record) => record.phone },
  { header: "fax", value: (record) => record.fax },
  { header: "email", value: (record) => record.email },
  { header: "officer", value: (record) => record.officer },
  { header: "power_units", value: (record) => record.powerUnits },
  { header: "truck_units", value: (record) => record.truckUnits },
  { header: "total_drivers", value: (record) => record.totalDrivers },
  { header: "cdl_drivers", value: (record) => record.cdlDrivers },
  { header: "interstate_drivers", value: (record) => record.interstateDrivers },
  { header: "intrastate_drivers", value: (record) => record.intrastateDrivers },
  { header: "tractors_owned", value: (record) => record.vehicles?.tractorsOwned ?? "" },
  { header: "tractors_term", value: (record) => record.vehicles?.tractorsTerm ?? "" },
  { header: "tractors_trip", value: (record) => record.vehicles?.tractorsTrip ?? "" },
  { header: "trucks_owned", value: (record) => record.vehicles?.trucksOwned ?? "" },
  { header: "trucks_term", value: (record) => record.vehicles?.trucksTerm ?? "" },
  { header: "trucks_trip", value: (record) => record.vehicles?.trucksTrip ?? "" },
  { header: "trailers_owned", value: (record) => record.vehicles?.trailersOwned ?? "" },
  { header: "trailers_term", value: (record) => record.vehicles?.trailersTerm ?? "" },
  { header: "trailers_trip", value: (record) => record.vehicles?.trailersTrip ?? "" },
  { header: "cargo", value: (record) => record.cargo.join("; ") },
  { header: "operation", value: (record) => record.operation },
  { header: "census_status", value: (record) => record.censusStatus },
  { header: "add_date", value: (record) => record.addDate },
  { header: "mcs150_date", value: (record) => record.mcs150Date },
  { header: "physical_address", value: (record) => record.physicalAddress },
  { header: "mailing_address", value: (record) => record.mailingAddress },
  { header: "min_coverage", value: (record) => record.minCoverage },
  { header: "bipd_on_file", value: (record) => record.bipdOnFile },
  { header: "cargo_on_file", value: (record) => record.cargoOnFile },
  { header: "bond_on_file", value: (record) => record.bondOnFile },
  { header: "census_matched", value: (record) => (record.censusMatched ? "yes" : "no") },
  { header: "motus_url", value: (record) => record.motusUrl },
];

function escapeCell(value: string | number | null | undefined): string {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function carriersToCsv(records: CarrierRecord[]): string {
  const header = COLUMNS.map((column) => column.header).join(",");
  const lines = records.map((record) =>
    COLUMNS.map((column) => escapeCell(column.value(record))).join(","),
  );
  return [header, ...lines].join("\n");
}
