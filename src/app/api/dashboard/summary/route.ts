import { withApiSession } from "@/lib/api";
import { todayIso } from "@/lib/dates";
import { getDashboardSummary } from "@/services/dashboard.service";

export const runtime = "nodejs";

// GET /api/dashboard/summary
// Ringkasan penjualan hari ini untuk akun yang sedang masuk.
export function GET(request: Request) {
  return withApiSession(request, async (session) =>
    Response.json({
      data: await getDashboardSummary(session.user.id, todayIso()),
    }),
  );
}
