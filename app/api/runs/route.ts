import { randomUUID } from "node:crypto";
import { createRun, listRuns, runningRunId } from "@/lib/db";
import { parseFilters } from "@/lib/filters";
import { startRun } from "@/lib/run-job";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ runs: listRuns() });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send the search filters as JSON." }, { status: 400 });
  }

  const parsed = parseFilters(body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const active = runningRunId();
  if (active) {
    return Response.json(
      { error: "A search is already running.", id: active },
      { status: 409 },
    );
  }

  const id = randomUUID();
  createRun(id, parsed.filters);
  startRun(id, parsed.filters);
  return Response.json({ id }, { status: 202 });
}
