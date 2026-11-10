import { withApiSession } from "@/lib/api";
import { todayIso } from "@/lib/dates";
import { getWeekTrend } from "@/services/dashboard.service";

export const runtime = "nodejs";

// GET /api/dashboard/week-trend
// Omzet per hari minggu ini dan hari yang sama minggu lalu (Senin–Minggu).
export function GET(request: Request) {
  return withApiSession(request, async (session) =>
    Response.json({ data: await getWeekTrend(session.user.id, todayIso()) }),
  );
}
