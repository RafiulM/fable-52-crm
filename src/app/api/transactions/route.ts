import { ApiError, readJson, withApiSession } from "@/lib/api";
import { createTransaction } from "@/services/transactions.service";
import { createTransactionSchema } from "@/validators/transactions";

export const runtime = "nodejs";

// POST /api/transactions
// Mencatat satu penjualan untuk anggota sales aktif milik akun ini.
export function POST(request: Request) {
  return withApiSession(request, async (session) => {
    const input = createTransactionSchema.parse(await readJson(request));
    const transaction = await createTransaction(session.user.id, input);
    if (!transaction)
      throw new ApiError(
        422,
        "SALES_MEMBER_UNAVAILABLE",
        "Sales tidak ditemukan atau sudah nonaktif.",
      );
    return Response.json(
      { data: transaction },
      {
        status: 201,
        headers: { Location: `/api/transactions/${transaction.id}` },
      },
    );
  });
}
