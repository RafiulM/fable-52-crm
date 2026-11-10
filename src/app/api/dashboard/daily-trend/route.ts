import { withApiSession } from "@/lib/api";
import { todayIso } from "@/lib/dates";
import { getDailyTrend } from "@/services/dashboard.service";

export const runtime = "nodejs";

// GET /api/dashboard/daily-trend
// Omzet harian 30 hari terakhir termasuk hari ini.
export function GET(request: Request) {
  return withApiSession(request, async (session) =>
    Response.json({ data: await getDailyTrend(session.user.id, todayIso()) }),
  );
}
