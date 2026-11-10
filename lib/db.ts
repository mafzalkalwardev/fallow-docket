import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { CarrierRecord, RunFilters, RunProgress, RunStatus, StoppedReason } from "@/lib/types";

type RunRow = {
  id: string;
  created_at: string;
  finished_at: string | null;
  status: RunStatus;
  filters_json: string;
  pages_read: number;
  rows_scanned: number;
  rows_kept: number;
  rows_dropped: number;
  error: string | null;
  note: string | null;
  stopped_reason: StoppedReason;
};

let database: DatabaseSync | null = null;

function databasePath(): string {
  return path.join(process.cwd(), "data", "fallow.db");
}

export function getDb(): DatabaseSync {
  if (database) return database;
  const file = databasePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      finished_at TEXT,
      status TEXT NOT NULL,
      filters_json TEXT NOT NULL,
      pages_read INTEGER NOT NULL DEFAULT 0,
      rows_scanned INTEGER NOT NULL DEFAULT 0,
      rows_kept INTEGER NOT NULL DEFAULT 0,
      rows_dropped INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      note TEXT,
      stopped_reason TEXT
    );
    CREATE TABLE IF NOT EXISTS carriers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id TEXT NOT NULL,
      mc_number TEXT,
      usdot TEXT,
      legal_name TEXT,
      status TEXT,
      city TEXT,
      state TEXT,
      phone TEXT,
      email TEXT,
      power_units INTEGER,
      total_drivers INTEGER,
      census_matched INTEGER NOT NULL,
      record_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS carriers_run_id ON carriers(run_id);
  `);
  db.prepare(
    `UPDATE runs
     SET status = 'error',
         error = 'The server restarted before this search finished.',
         finished_at = ?
     WHERE status = 'running'`,
  ).run(new Date().toISOString());
  database = db;
  return db;
}

function asRun(row: unknown): RunRow {
  return row as RunRow;
}

export function toProgress(row: RunRow): RunProgress {
  return {
    id: row.id,
    createdAt: row.created_at,
    finishedAt: row.finished_at,
    status: row.status,
    filters: JSON.parse(row.filters_json) as RunFilters,
    pagesRead: row.pages_read,
    rowsScanned: row.rows_scanned,
    rowsKept: row.rows_kept,
    rowsDropped: row.rows_dropped,
    error: row.error,
    note: row.note,
    stoppedReason: row.stopped_reason,
  };
}

export function runningRunId(): string | null {
  const row = getDb().prepare(`SELECT id FROM runs WHERE status = 'running' LIMIT 1`).get() as
    | { id: string }
    | undefined;
  return row?.id ?? null;
}

export function createRun(id: string, filters: RunFilters): void {
  getDb()
    .prepare(
      `INSERT INTO runs (id, created_at, status, filters_json)
       VALUES (?, ?, 'running', ?)`,
    )
    .run(id, new Date().toISOString(), JSON.stringify(filters));
}

export function updateRunProgress(
  id: string,
  progress: {
    pagesRead: number;
    rowsScanned: number;
    rowsKept: number;
    rowsDropped: number;
    note?: string | null;
  },
): void {
  getDb()
    .prepare(
      `UPDATE runs
       SET pages_read = ?, rows_scanned = ?, rows_kept = ?, rows_dropped = ?, note = ?
       WHERE id = ?`,
    )
    .run(
      progress.pagesRead,
      progress.rowsScanned,
      progress.rowsKept,
      progress.rowsDropped,
      progress.note ?? null,
      id,
    );
}

export function finishRun(
  id: string,
  result: {
    status: RunStatus;
    pagesRead: number;
    rowsScanned: number;
    rowsKept: number;
    rowsDropped: number;
    note: string | null;
    error: string | null;
    stoppedReason: StoppedReason;
  },
): void {
  getDb()
    .prepare(
      `UPDATE runs
       SET status = ?, finished_at = ?, pages_read = ?, rows_scanned = ?, rows_kept = ?,
           rows_dropped = ?, note = ?, error = ?, stopped_reason = ?
       WHERE id = ?`,
    )
    .run(
      result.status,
      new Date().toISOString(),
      result.pagesRead,
      result.rowsScanned,
      result.rowsKept,
      result.rowsDropped,
      result.note,
      result.error,
      result.stoppedReason,
      id,
    );
}

export function insertCarriers(runId: string, records: CarrierRecord[]): void {
  if (records.length === 0) return;
  const db = getDb();
  const insert = db.prepare(
    `INSERT INTO carriers (
      run_id, mc_number, usdot, legal_name, status, city, state, phone, email,
      power_units, total_drivers, census_matched, record_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  db.exec("BEGIN");
  try {
    for (const record of records) {
      insert.run(
        runId,
        record.mcNumber,
        record.usdot,
        record.legalName,
        record.authorityStatus,
        record.city,
        record.state,
        record.phone,
        record.email,
        record.powerUnits,
        record.totalDrivers,
        record.censusMatched ? 1 : 0,
        JSON.stringify(record),
      );
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function getRun(id: string): RunProgress | null {
  const row = getDb().prepare(`SELECT * FROM runs WHERE id = ?`).get(id);
  if (!row) return null;
  return toProgress(asRun(row));
}

export function listRuns(limit = 15): RunProgress[] {
  const rows = getDb()
    .prepare(`SELECT * FROM runs ORDER BY created_at DESC LIMIT ?`)
    .all(limit) as unknown as RunRow[];
  return rows.map(toProgress);
}

export function listCarriers(runId: string, offset: number, limit: number): CarrierRecord[] {
  const rows = getDb()
    .prepare(
      `SELECT record_json FROM carriers WHERE run_id = ? ORDER BY id LIMIT ? OFFSET ?`,
    )
    .all(runId, limit, offset) as unknown as { record_json: string }[];
  return rows.map((row) => JSON.parse(row.record_json) as CarrierRecord);
}

export function countCarriers(runId: string): number {
  const row = getDb()
    .prepare(`SELECT COUNT(*) AS total FROM carriers WHERE run_id = ?`)
    .get(runId) as { total: number } | undefined;
  return row?.total ?? 0;
}
