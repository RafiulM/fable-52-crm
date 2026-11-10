import { ApiError, readJson, withApiSession } from "@/lib/api";
import {
  createTransaction,
  listTransactions,
} from "@/services/transactions.service";
import {
  createTransactionSchema,
  listTransactionsSchema,
} from "@/validators/transactions";

export const runtime = "nodejs";

// GET /api/transactions?limit=&offset=&salesMemberId=&q=&from=&to=
// Riwayat transaksi akun ini, terbaru dulu, dengan total sesuai filter.
export function GET(request: Request) {
  return withApiSession(request, async (session) => {
    const query = listTransactionsSchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return Response.json(await listTransactions(session.user.id, query));
  });
}

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
