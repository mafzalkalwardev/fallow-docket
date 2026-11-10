const BASE = "https://data.transportation.gov/resource";

export const LEGACY_DATASET = "6eyk-hxee";
export const CENSUS_DATASET = "az4n-8mr2";

export const LEGACY_SELECT = [
  "docket_number",
  "dot_number",
  "common_stat",
  "contract_stat",
  "broker_stat",
  "common_app_pend",
  "contract_app_pend",
  "broker_app_pend",
  "common_rev_pend",
  "contract_rev_pend",
  "broker_rev_pend",
  "property_chk",
  "passenger_chk",
  "hhg_chk",
  "min_cov_amount",
  "bipd_file",
  "cargo_file",
  "bond_file",
  "dba_name",
  "legal_name",
  "bus_street_po",
  "bus_city",
  "bus_state_code",
  "bus_zip_code",
  "bus_telno",
  "bus_fax",
  "mail_street_po",
  "mail_city",
  "mail_state_code",
  "mail_zip_code",
  "mail_telno",
  "mail_fax",
].join(",");

export const CENSUS_SELECT = [
  "dot_number",
  "legal_name",
  "dba_name",
  "phone",
  "cell_phone",
  "email_address",
  "company_officer_1",
  "power_units",
  "truck_units",
  "owntract",
  "trmtract",
  "trptract",
  "owntruck",
  "trmtruck",
  "trptruck",
  "owntrail",
  "trmtrail",
  "trptrail",
  "total_drivers",
  "total_cdl",
  "driver_inter_total",
  "total_intrastate_drivers",
  "classdef",
  "status_code",
  "add_date",
  "mcs150_date",
  "phy_street",
  "phy_city",
  "phy_state",
  "phy_zip",
  "carrier_mailing_street",
  "carrier_mailing_city",
  "carrier_mailing_state",
  "carrier_mailing_zip",
  "crgo_genfreight",
  "crgo_household",
  "crgo_metalsheet",
  "crgo_motoveh",
  "crgo_logpole",
  "crgo_bldgmat",
  "crgo_mobilehome",
  "crgo_machlrg",
  "crgo_produce",
  "crgo_liqgas",
  "crgo_intermodal",
  "crgo_passengers",
  "crgo_oilfield",
  "crgo_livestock",
  "crgo_grainfeed",
  "crgo_coalcoke",
  "crgo_meat",
  "crgo_garbage",
  "crgo_usmail",
  "crgo_chem",
  "crgo_drybulk",
  "crgo_coldfood",
  "crgo_beverages",
  "crgo_paperprod",
  "crgo_utility",
  "crgo_farmsupp",
  "crgo_construct",
  "crgo_waterwell",
  "crgo_cargoothr",
  "crgo_cargoothr_desc",
].join(",");

export type SocrataRow = Record<string, string>;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function socrataRows(
  dataset: string,
  params: Record<string, string>,
): Promise<SocrataRow[]> {
  const url = new URL(`${BASE}/${dataset}.json`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  const token = process.env.SOCRATA_APP_TOKEN?.trim();
  if (token) headers["X-App-Token"] = token;

  let lastStatus = "";
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
    });

    if (response.status === 429 || response.status >= 500) {
      lastStatus = String(response.status);
      const retryAfter = Number(response.headers.get("retry-after"));
      const wait =
        Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : 600 * 2 ** attempt;
      await sleep(wait);
      continue;
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `DOT open data returned ${response.status} for ${dataset}. ${body.slice(0, 240)}`,
      );
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      throw new Error(`DOT open data returned an unexpected payload for ${dataset}.`);
    }
    return payload as SocrataRow[];
  }

  throw new Error(
    `DOT open data kept rate-limiting ${dataset} (HTTP ${lastStatus}). Wait a minute and run the search again.`,
  );
}
