import { ApiError, readJson, withApiSession } from "@/lib/api";
import { updateSalesMember } from "@/services/sales-members.service";
import {
  salesMemberIdSchema,
  updateSalesMemberSchema,
} from "@/validators/sales-members";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

// PATCH /api/sales-members/:id
// Mengubah nama atau telepon, menonaktifkan (isActive: false), atau
// mengaktifkan kembali (isActive: true).
export function PATCH(request: Request, context: Context) {
  return withApiSession(request, async (session) => {
    const id = salesMemberIdSchema.parse((await context.params).id);
    const input = updateSalesMemberSchema.parse(await readJson(request));
    const member = await updateSalesMember(session.user.id, id, input);
    if (!member)
      throw new ApiError(404, "NOT_FOUND", "Anggota tidak ditemukan.");
    return Response.json({ data: member });
  });
}
