import "server-only";
import { and, asc, eq, gte, isNotNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { leads, salesMembers, transactions } from "@/db/schema";
import { addDays, startOfMonth } from "@/lib/dates";
import { WON_STATUS } from "@/lib/lead-status";
import type { DashboardData, SalesStat } from "@/types/dashboard";

// Semua angka dashboard dihitung di database dari data mentah milik akun yang
// sedang masuk. `userId` selalu berasal dari sesi terverifikasi, dan setiap
// query menyaringnya di SQL.

// Total penjualan dan jumlah transaksi pada rentang tanggal (inklusif).
async function salesTotals(userId: string, from: string, to: string) {
  const [row] = await db
    .select({
      amount: sql`coalesce(sum(${transactions.amount}), 0)`.mapWith(Number),
      count: sql`count(*)`.mapWith(Number),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.transactionDate, from),
        lte(transactions.transactionDate, to),
      ),
    );
  return row;
}

// Jumlah leads yang masuk pada rentang tanggal, dan berapa yang jadi beli.
async function leadTotals(userId: string, from: string, to: string) {
  const [row] = await db
    .select({
      total: sql`count(*)`.mapWith(Number),
      won: sql`count(*) filter (where ${leads.status} = ${WON_STATUS})`.mapWith(
        Number,
      ),
    })
    .from(leads)
    .where(
      and(
        eq(leads.userId, userId),
        gte(leads.leadDate, from),
        lte(leads.leadDate, to),
      ),
    );
  return row;
}

// Ringkasan hari ini: penjualan, transaksi, dan leads hari ini beserta angka
// kemarin sebagai pembanding, plus konversi leads bulan berjalan.
export async function getDashboardSummary(
  userId: string,
  today: string,
): Promise<DashboardData["summary"]> {
  const yesterday = addDays(today, -1);
  const [todaySales, yesterdaySales, todayLeads, yesterdayLeads, monthLeads] =
    await Promise.all([
      salesTotals(userId, today, today),
      salesTotals(userId, yesterday, yesterday),
      leadTotals(userId, today, today),
      leadTotals(userId, yesterday, yesterday),
      leadTotals(userId, startOfMonth(today), today),
    ]);

  return {
    today: { ...todaySales, leads: todayLeads.total },
    yesterday: { ...yesterdaySales, leads: yesterdayLeads.total },
    monthLeads,
  };
}

// Omzet, jumlah transaksi, leads, dan konversi tiap anggota sales pada rentang
// tanggal (inklusif). Anggota nonaktif hanya ikut tampil kalau masih punya
// penjualan atau leads di rentang itu, supaya totalnya tetap cocok.
export async function getSalesComparison(
  userId: string,
  from: string,
  to: string,
): Promise<SalesStat[]> {
  const sales = db
    .select({
      memberId: transactions.salesMemberId,
      amount: sql`sum(${transactions.amount})`.as("amount"),
      count: sql`count(*)`.as("count"),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.transactionDate, from),
        lte(transactions.transactionDate, to),
      ),
    )
    .groupBy(transactions.salesMemberId)
    .as("sales");

  const leadCounts = db
    .select({
      memberId: leads.salesMemberId,
      total: sql`count(*)`.as("total"),
      won: sql`count(*) filter (where ${leads.status} = ${WON_STATUS})`.as(
        "won",
      ),
    })
    .from(leads)
    .where(
      and(
        eq(leads.userId, userId),
        gte(leads.leadDate, from),
        lte(leads.leadDate, to),
      ),
    )
    .groupBy(leads.salesMemberId)
    .as("lead_counts");

  return db
    .select({
      salesId: salesMembers.id,
      name: salesMembers.name,
      amount: sql`coalesce(${sales.amount}, 0)`.mapWith(Number),
      count: sql`coalesce(${sales.count}, 0)`.mapWith(Number),
      leads: sql`coalesce(${leadCounts.total}, 0)`.mapWith(Number),
      won: sql`coalesce(${leadCounts.won}, 0)`.mapWith(Number),
    })
    .from(salesMembers)
    .leftJoin(sales, eq(sales.memberId, salesMembers.id))
    .leftJoin(leadCounts, eq(leadCounts.memberId, salesMembers.id))
    .where(
      and(
        eq(salesMembers.userId, userId),
        or(
          eq(salesMembers.isActive, true),
          isNotNull(sales.memberId),
          isNotNull(leadCounts.memberId),
        ),
      ),
    )
    .orderBy(asc(salesMembers.name), asc(salesMembers.id));
}
