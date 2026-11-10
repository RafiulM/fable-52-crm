import { withApiSession } from "@/lib/api";
import { todayIso } from "@/lib/dates";
import { getDashboard } from "@/services/dashboard.service";

export const runtime = "nodejs";

// GET /api/dashboard
// Seluruh data dashboard dalam satu panggilan: ringkasan, perbandingan sales,
// tren mingguan dan harian, serta transaksi hari ini. Dipakai untuk memuat
// ulang dashboard tanpa berpindah halaman.
export function GET(request: Request) {
  return withApiSession(request, async (session) =>
    Response.json({ data: await getDashboard(session.user.id, todayIso()) }),
  );
}
