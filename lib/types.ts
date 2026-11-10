export type AuthorityStatus =
  | "inactive"
  | "active"
  | "pending"
  | "revocation_pending"
  | "any";

export type CarrierKind =
  | "property"
  | "passenger"
  | "household"
  | "broker"
  | "any";

export type RunFilters = {
  state: string;
  status: AuthorityStatus;
  kind: CarrierKind;
  requirePhone: boolean;
  requireEmail: boolean;
  minPowerUnits: number | null;
  maxPowerUnits: number | null;
  addedBeforeYear: number | null;
  cap: number;
};

export type RunStatus = "running" | "completed" | "error";

export type StoppedReason = "cap" | "end" | "scan_limit" | null;

export type RunProgress = {
  id: string;
  createdAt: string;
  finishedAt: string | null;
  status: RunStatus;
  filters: RunFilters;
  pagesRead: number;
  rowsScanned: number;
  rowsKept: number;
  rowsDropped: number;
  error: string | null;
  note: string | null;
  stoppedReason: StoppedReason;
};

export type VehicleCounts = {
  tractorsOwned: number;
  tractorsTerm: number;
  tractorsTrip: number;
  trucksOwned: number;
  trucksTerm: number;
  trucksTrip: number;
  trailersOwned: number;
  trailersTerm: number;
  trailersTrip: number;
};

export type CarrierRecord = {
  legalName: string;
  dbaName: string;
  mcNumber: string;
  usdot: string;
  authorityStatus: string;
  authorityDetail: string;
  kinds: string[];
  city: string;
  state: string;
  phone: string;
  fax: string;
  email: string;
  officer: string;
  powerUnits: number | null;
  truckUnits: number | null;
  totalDrivers: number | null;
  cdlDrivers: number | null;
  interstateDrivers: number | null;
  intrastateDrivers: number | null;
  vehicles: VehicleCounts | null;
  cargo: string[];
  operation: string;
  censusStatus: string;
  addDate: string;
  mcs150Date: string;
  physicalAddress: string;
  mailingAddress: string;
  minCoverage: string;
  bipdOnFile: string;
  cargoOnFile: string;
  bondOnFile: string;
  censusMatched: boolean;
  motusUrl: string;
};
