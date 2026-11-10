import { ApiError, readJson, withApiSession } from "@/lib/api";
import { getTargetBoard, saveTargets } from "@/services/targets.service";
import { saveTargetsSchema, targetPeriodSchema } from "@/validators/targets";

export const runtime = "nodejs";

// GET /api/targets?mode=daily&date=YYYY-MM-DD
// GET /api/targets?mode=monthly&month=YYYY-MM
// Target dan pencapaian tiap sales pada periode itu.
export function GET(request: Request) {
  return withApiSession(request, async (session) => {
    const period = targetPeriodSchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return Response.json({
      data: await getTargetBoard(session.user.id, period),
      meta: period,
    });
  });
}

// PUT /api/targets — menyimpan target beberapa sales untuk satu tanggal atau
// satu bulan. Nominal 0 menghapus target sales itu.
export function PUT(request: Request) {
  return withApiSession(request, async (session) => {
    const { targets, ...period } = saveTargetsSchema.parse(
      await readJson(request),
    );
    if (!(await saveTargets(session.user.id, period, targets)))
      throw new ApiError(
        422,
        "SALES_MEMBER_UNAVAILABLE",
        "Ada sales yang tidak ditemukan. Muat ulang halaman lalu coba lagi.",
      );
    return Response.json({
      data: await getTargetBoard(session.user.id, period),
      meta: period,
    });
  });
}
