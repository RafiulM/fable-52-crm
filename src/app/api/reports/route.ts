import { withApiSession } from "@/lib/api";
import { todayIso } from "@/lib/dates";
import { getReport } from "@/services/reports.service";
import { reportQuerySchema } from "@/validators/reports";

export const runtime = "nodejs";

// GET /api/reports?period=today|week|month
// GET /api/reports?period=custom&from=YYYY-MM-DD&to=YYYY-MM-DD
// Rekap penjualan, leads, dan konversi per sales, berikut periode pembanding.
export function GET(request: Request) {
  return withApiSession(request, async (session) => {
    const query = reportQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    const custom =
      query.period === "custom" && query.from && query.to
        ? { from: query.from, to: query.to }
        : undefined;
    return Response.json({
      data: await getReport(session.user.id, query.period, todayIso(), custom),
    });
  });
}
