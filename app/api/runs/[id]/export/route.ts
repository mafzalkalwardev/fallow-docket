import { carriersToCsv } from "@/lib/csv";
import { countCarriers, getRun, listCarriers } from "@/lib/db";

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

  const total = countCarriers(id);
  const carriers = listCarriers(id, 0, total);
  const csv = carriersToCsv(carriers);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fallow-docket-${id}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
