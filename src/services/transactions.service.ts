import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { salesMembers, transactions } from "@/db/schema";
import { isActiveSalesMember } from "@/services/sales-members.service";
import type { CreateTransactionInput } from "@/validators/transactions";

// Kolom yang boleh keluar ke klien. Pemilik data datang dari sesi, bukan dari sini.
const fields = {
  id: transactions.id,
  salesMemberId: transactions.salesMemberId,
  salesName: salesMembers.name,
  amount: transactions.amount,
  productDescription: transactions.productDescription,
  transactionDate: transactions.transactionDate,
  createdAt: transactions.createdAt,
  updatedAt: transactions.updatedAt,
};

export async function getTransaction(userId: string, id: string) {
  const [row] = await db
    .select(fields)
    .from(transactions)
    .innerJoin(salesMembers, eq(salesMembers.id, transactions.salesMemberId))
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .limit(1);
  return row;
}

// Transaksi pada satu tanggal bisnis, terbaru dulu.
export async function listTransactionsOnDate(userId: string, date: string) {
  return db
    .select(fields)
    .from(transactions)
    .innerJoin(salesMembers, eq(salesMembers.id, transactions.salesMemberId))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.transactionDate, date),
      ),
    )
    .orderBy(desc(transactions.createdAt), desc(transactions.id));
}

// Mengembalikan null kalau sales bukan milik akun ini atau sudah nonaktif.
export async function createTransaction(
  userId: string,
  input: CreateTransactionInput,
) {
  if (!(await isActiveSalesMember(userId, input.salesMemberId))) return null;
  const [created] = await db
    .insert(transactions)
    .values({
      userId,
      salesMemberId: input.salesMemberId,
      amount: input.amount,
      productDescription: input.productDescription,
      transactionDate: input.transactionDate,
    })
    .returning({ id: transactions.id });
  return getTransaction(userId, created.id);
}
