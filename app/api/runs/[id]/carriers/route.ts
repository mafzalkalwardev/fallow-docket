import { countCarriers, getRun, listCarriers } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const run = getRun(id);
  if (!run) {
    return Response.json({ error: "That search is not on this server." }, { status: 404 });
  }

  const url = new URL(request.url);
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0) || 0);
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit") ?? 100) || 100));

  return Response.json({
    carriers: listCarriers(id, offset, limit),
    total: countCarriers(id),
    offset,
    limit,
  });
}
