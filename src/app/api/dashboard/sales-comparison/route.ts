import { withApiSession } from "@/lib/api";
import { periodRange, todayIso } from "@/lib/dates";
import { getSalesComparison } from "@/services/dashboard.service";
import { dashboardPeriodSchema } from "@/validators/dashboard";

export const runtime = "nodejs";

// GET /api/dashboard/sales-comparison?period=today|week|month
// Omzet, transaksi, leads, dan konversi tiap anggota sales pada periode itu.
export function GET(request: Request) {
  return withApiSession(request, async (session) => {
    const { period } = dashboardPeriodSchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    const { from, to } = periodRange(period, todayIso());
    return Response.json({
      data: await getSalesComparison(session.user.id, from, to),
      meta: { period, from, to },
    });
  });
}
