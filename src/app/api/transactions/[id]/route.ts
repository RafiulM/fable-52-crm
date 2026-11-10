import { ApiError, readJson, withApiSession } from "@/lib/api";
import {
  deleteTransaction,
  getTransaction,
  updateTransaction,
} from "@/services/transactions.service";
import {
  transactionIdSchema,
  updateTransactionSchema,
} from "@/validators/transactions";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

const notFound = () =>
  new ApiError(404, "NOT_FOUND", "Transaksi tidak ditemukan.");

export function GET(request: Request, context: Context) {
  return withApiSession(request, async (session) => {
    const id = transactionIdSchema.parse((await context.params).id);
    const transaction = await getTransaction(session.user.id, id);
    if (!transaction) throw notFound();
    return Response.json({ data: transaction });
  });
}

// PATCH /api/transactions/:id — memperbaiki sales, tanggal, nominal, atau keterangan.
export function PATCH(request: Request, context: Context) {
  return withApiSession(request, async (session) => {
    const id = transactionIdSchema.parse((await context.params).id);
    const input = updateTransactionSchema.parse(await readJson(request));
    const result = await updateTransaction(session.user.id, id, input);
    if (result.status === "not_found") throw notFound();
    if (result.status === "sales_member_unavailable")
      throw new ApiError(
        422,
        "SALES_MEMBER_UNAVAILABLE",
        "Sales tidak ditemukan atau sudah nonaktif.",
      );
    return Response.json({ data: result.transaction });
  });
}

export function DELETE(request: Request, context: Context) {
  return withApiSession(request, async (session) => {
    const id = transactionIdSchema.parse((await context.params).id);
    if (!(await deleteTransaction(session.user.id, id))) throw notFound();
    return new Response(null, { status: 204 });
  });
}
