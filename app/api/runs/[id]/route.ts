import { getRun } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const run = getRun(id);
  if (!run) {
    return Response.json({ error: "That search is not on this server." }, { status: 404 });
  }
  return Response.json(run);
}
