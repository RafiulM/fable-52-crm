import { readJson, withApiSession } from "@/lib/api";
import {
  createSalesMember,
  listSalesMembers,
} from "@/services/sales-members.service";
import {
  createSalesMemberSchema,
  listSalesMembersSchema,
} from "@/validators/sales-members";

export const runtime = "nodejs";

// GET /api/sales-members?status=all|active|inactive
// Anggota tim milik akun ini. status=active dipakai untuk pilihan sales di
// form transaksi, leads, dan target.
export function GET(request: Request) {
  return withApiSession(request, async (session) => {
    const { status } = listSalesMembersSchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return Response.json({
      data: await listSalesMembers(session.user.id, status),
    });
  });
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
