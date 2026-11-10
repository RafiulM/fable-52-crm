import { ApiError, readJson, withApiSession } from "@/lib/api";
import { getLead, updateLead } from "@/services/leads.service";
import { leadIdSchema, updateLeadSchema } from "@/validators/leads";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

const notFound = () => new ApiError(404, "NOT_FOUND", "Lead tidak ditemukan.");

export function GET(request: Request, context: Context) {
  return withApiSession(request, async (session) => {
    const id = leadIdSchema.parse((await context.params).id);
    const lead = await getLead(session.user.id, id);
    if (!lead) throw notFound();
    return Response.json({ data: lead });
  });
}

// PATCH /api/leads/:id — mengubah status (mis. menjadi "jadi_beli") atau data lead.
export function PATCH(request: Request, context: Context) {
  return withApiSession(request, async (session) => {
    const id = leadIdSchema.parse((await context.params).id);
    const input = updateLeadSchema.parse(await readJson(request));
    const result = await updateLead(session.user.id, id, input);
    if (result.status === "not_found") throw notFound();
    if (result.status === "sales_member_unavailable")
      throw new ApiError(
        422,
        "SALES_MEMBER_UNAVAILABLE",
        "Sales tidak ditemukan atau sudah nonaktif.",
      );
    return Response.json({ data: result.lead });
  });
}
