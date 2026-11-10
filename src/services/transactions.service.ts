import "server-only";
import { and, desc, eq, gte, ilike, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { salesMembers, transactions } from "@/db/schema";
import { isActiveSalesMember } from "@/services/sales-members.service";
import type {
  CreateTransactionInput,
  ListTransactionsInput,
  UpdateTransactionInput,
} from "@/validators/transactions";

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

// Karakter %, _ dan \ pada kata cari diperlakukan sebagai teks biasa.
function likePattern(text: string) {
  return `%${text.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

function listFilter(userId: string, input: ListTransactionsInput) {
  return and(
    eq(transactions.userId, userId),
    input.salesMemberId
      ? eq(transactions.salesMemberId, input.salesMemberId)
      : undefined,
    input.q
      ? ilike(transactions.productDescription, likePattern(input.q))
      : undefined,
    input.from ? gte(transactions.transactionDate, input.from) : undefined,
    input.to ? lte(transactions.transactionDate, input.to) : undefined,
  );
}

// Riwayat transaksi milik akun ini, terbaru dulu. `meta.total` dan
// `meta.totalAmount` menghitung semua transaksi yang cocok dengan filter,
// bukan hanya halaman yang dikirim.
export async function listTransactions(
  userId: string,
  input: ListTransactionsInput,
) {
  const where = listFilter(userId, input);
  const [rows, [summary]] = await Promise.all([
    db
      .select(fields)
      .from(transactions)
      .innerJoin(salesMembers, eq(salesMembers.id, transactions.salesMemberId))
      .where(where)
      .orderBy(
        desc(transactions.transactionDate),
        desc(transactions.createdAt),
        desc(transactions.id),
      )
      .limit(input.limit + 1)
      .offset(input.offset),
    db
      .select({
        total: sql`count(*)`.mapWith(Number),
        totalAmount: sql`coalesce(sum(${transactions.amount}), 0)`.mapWith(
          Number,
        ),
      })
      .from(transactions)
      .where(where),
  ]);
  return {
    data: rows.slice(0, input.limit),
    meta: {
      limit: input.limit,
      offset: input.offset,
      hasMore: rows.length > input.limit,
      total: summary.total,
      totalAmount: summary.totalAmount,
    },
  };
}

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

export type UpdateTransactionResult =
  | { status: "ok"; transaction: Awaited<ReturnType<typeof getTransaction>> }
  | { status: "not_found" }
  | { status: "sales_member_unavailable" };

// Memindahkan transaksi ke sales lain hanya boleh ke sales yang aktif.
// Sales lama yang sudah nonaktif tetap boleh dipertahankan.
export async function updateTransaction(
  userId: string,
  id: string,
  input: UpdateTransactionInput,
): Promise<UpdateTransactionResult> {
  const current = await getTransaction(userId, id);
  if (!current) return { status: "not_found" };
  if (
    input.salesMemberId &&
    input.salesMemberId !== current.salesMemberId &&
    !(await isActiveSalesMember(userId, input.salesMemberId))
  )
    return { status: "sales_member_unavailable" };

  const [updated] = await db
    .update(transactions)
    .set({
      salesMemberId: input.salesMemberId,
      amount: input.amount,
      productDescription: input.productDescription,
      transactionDate: input.transactionDate,
    })
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning({ id: transactions.id });
  if (!updated) return { status: "not_found" };
  return { status: "ok", transaction: await getTransaction(userId, id) };
}

export async function deleteTransaction(userId: string, id: string) {
  const [deleted] = await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning({ id: transactions.id });
  return Boolean(deleted);
}
