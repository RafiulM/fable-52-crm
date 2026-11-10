import { readJson, withApiSession } from "@/lib/api";
import {
  createSalesMember,
  listSalesMembers,
} from "@/services/sales-members.service";
import { createSalesMemberSchema } from "@/validators/sales-members";

export const runtime = "nodejs";

// GET /api/sales-members — semua anggota tim milik akun ini beserta status aktifnya.
export function GET(request: Request) {
  return withApiSession(request, async (session) =>
    Response.json({ data: await listSalesMembers(session.user.id) }),
  );
}

// POST /api/sales-members — mendaftarkan anggota baru (langsung aktif).
export function POST(request: Request) {
  return withApiSession(request, async (session) => {
    const input = createSalesMemberSchema.parse(await readJson(request));
    const member = await createSalesMember(session.user.id, input);
    return Response.json(
      { data: member },
      { status: 201, headers: { Location: `/api/sales-members/${member.id}` } },
    );
  });
}
