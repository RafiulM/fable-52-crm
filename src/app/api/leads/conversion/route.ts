import { withApiSession } from "@/lib/api";
import { periodRange, todayIso } from "@/lib/dates";
import { getLeadConversion } from "@/services/leads.service";
import { leadConversionSchema } from "@/validators/leads";

export const runtime = "nodejs";

// GET /api/leads/conversion?period=month|all
// Jumlah leads dan leads jadi beli tiap sales; persentasenya = won / total.
export function GET(request: Request) {
  return withApiSession(request, async (session) => {
    const { period } = leadConversionSchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    const range =
      period === "month" ? periodRange("month", todayIso()) : undefined;
    return Response.json({
      data: await getLeadConversion(session.user.id, range),
      meta: { period, ...range },
    });
  });
}
