import { ApiError, readJson, withApiSession } from "@/lib/api";
import { todayIso } from "@/lib/dates";
import { createLead, listLeads } from "@/services/leads.service";
import { createLeadSchema, listLeadsSchema } from "@/validators/leads";

export const runtime = "nodejs";

// GET /api/leads?limit=&offset=&salesMemberId=&status=&q=&sort=recent|sales
export function GET(request: Request) {
  return withApiSession(request, async (session) => {
    const query = listLeadsSchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return Response.json(await listLeads(session.user.id, query));
  });
}

// POST /api/leads — menyimpan calon pembeli dan menugaskannya ke sales aktif.
export function POST(request: Request) {
  return withApiSession(request, async (session) => {
    const input = createLeadSchema.parse(await readJson(request));
    const lead = await createLead(session.user.id, input, todayIso());
    if (!lead)
      throw new ApiError(
        422,
        "SALES_MEMBER_UNAVAILABLE",
        "Sales tidak ditemukan atau sudah nonaktif.",
      );
    return Response.json(
      { data: lead },
      { status: 201, headers: { Location: `/api/leads/${lead.id}` } },
    );
  });
}
