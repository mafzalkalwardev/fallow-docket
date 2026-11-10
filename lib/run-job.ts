import { buildLegacyWhere, needsCensusFilter } from "@/lib/filters";
import {
  countCarriers,
  finishRun,
  insertCarriers,
  updateRunProgress,
} from "@/lib/db";
import { censusWhere, dropReason, mergeCarrier } from "@/lib/normalize";
import {
  CENSUS_DATASET,
  CENSUS_SELECT,
  LEGACY_DATASET,
  LEGACY_SELECT,
  sleep,
  socrataRows,
  type SocrataRow,
} from "@/lib/socrata";
import { stripDot } from "@/lib/format";
import type { RunFilters, StoppedReason } from "@/lib/types";

const PAGE_SIZE = 1000;
const MAX_PAGES = 30;
const CENSUS_BATCH = 25;

const jobs = new Map<string, Promise<void>>();

async function loadCensus(dotNumbers: string[]): Promise<Map<string, SocrataRow>> {
  const unique = [...new Set(dotNumbers.map((dot) => stripDot(dot)).filter(Boolean))];
  const map = new Map<string, SocrataRow>();
  for (let index = 0; index < unique.length; index += CENSUS_BATCH) {
    if (index > 0) await sleep(150);
    const slice = unique.slice(index, index + CENSUS_BATCH);
    const rows = await socrataRows(CENSUS_DATASET, {
      $select: CENSUS_SELECT,
      $where: censusWhere(slice),
      $limit: "200",
    });
    for (const row of rows) {
      const key = stripDot(row.dot_number);
      if (key && !map.has(key)) map.set(key, row);
    }
  }
  return map;
}

function finishNote(kept: number, dropped: number, reason: StoppedReason, scanned: number): string {
  const droppedText =
    dropped > 0
      ? ` ${dropped.toLocaleString("en-US")} rows were set aside because they missed a phone, email, fleet size, or census year.`
      : "";
  if (reason === "cap") {
    return `Kept ${kept.toLocaleString("en-US")}, the cap for this search.${droppedText}`;
  }
  if (reason === "scan_limit") {
    return `Stopped after reading ${scanned.toLocaleString("en-US")} legacy dockets so one search stays bounded. Narrow the filters to reach the cap.${droppedText}`;
  }
  if (kept === 0) return "No legacy dockets matched these filters.";
  return `That is every legacy docket matching these filters.${droppedText}`;
}

async function execute(id: string, filters: RunFilters): Promise<void> {
  let pagesRead = 0;
  let rowsScanned = 0;
  let rowsKept = 0;
  let rowsDropped = 0;
  let offset = 0;
  let stopped: StoppedReason = "end";
  const overscan = needsCensusFilter(filters);

  try {
    while (rowsKept < filters.cap && pagesRead < MAX_PAGES) {
      const limit = overscan ? PAGE_SIZE : Math.min(PAGE_SIZE, filters.cap - rowsKept);
      const legacyRows = await socrataRows(LEGACY_DATASET, {
        $select: LEGACY_SELECT,
        $where: buildLegacyWhere(filters),
        $order: "docket_number",
        $limit: String(limit),
        $offset: String(offset),
      });
      pagesRead += 1;
      rowsScanned += legacyRows.length;
      offset += legacyRows.length;

      if (legacyRows.length === 0) {
        stopped = "end";
        break;
      }

      for (let index = 0; index < legacyRows.length && rowsKept < filters.cap; index += CENSUS_BATCH) {
        if (index > 0) await sleep(150);
        const slice = legacyRows.slice(index, index + CENSUS_BATCH);
        updateRunProgress(id, {
          pagesRead,
          rowsScanned,
          rowsKept,
          rowsDropped,
          note: "Matching company census rows…",
        });
        const census = await loadCensus(slice.map((row) => row.dot_number ?? ""));
        const accepted = [];
        for (const row of slice) {
          if (rowsKept + accepted.length >= filters.cap) break;
          if (!String(row.docket_number ?? "").toUpperCase().startsWith("MC")) continue;
          const record = mergeCarrier(row, census.get(stripDot(row.dot_number)));
          if (dropReason(record, filters)) {
            rowsDropped += 1;
            continue;
          }
          accepted.push(record);
        }
        insertCarriers(id, accepted);
        rowsKept += accepted.length;
      }

      updateRunProgress(id, { pagesRead, rowsScanned, rowsKept, rowsDropped, note: null });

      if (rowsKept >= filters.cap) {
        stopped = "cap";
        break;
      }
      if (legacyRows.length < limit) {
        stopped = "end";
        break;
      }
      await sleep(200);
    }

    if (rowsKept < filters.cap && pagesRead >= MAX_PAGES && stopped !== "end") {
      stopped = "scan_limit";
    }
    if (rowsKept >= filters.cap) stopped = "cap";

    const kept = countCarriers(id);
    finishRun(id, {
      status: "completed",
      pagesRead,
      rowsScanned,
      rowsKept: kept,
      rowsDropped,
      note: finishNote(kept, rowsDropped, stopped, rowsScanned),
      error: null,
      stoppedReason: stopped,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The search failed before it could finish.";
    finishRun(id, {
      status: "error",
      pagesRead,
      rowsScanned,
      rowsKept: countCarriers(id),
      rowsDropped,
      note: null,
      error: message,
      stoppedReason: null,
    });
  }
}

export function startRun(id: string, filters: RunFilters): void {
  const job = execute(id, filters).finally(() => {
    jobs.delete(id);
  });
  jobs.set(id, job);
}
