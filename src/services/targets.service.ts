import "server-only";
import {
  and,
  asc,
  eq,
  gte,
  inArray,
  isNotNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import {
  dailyTargets,
  monthlyTargets,
  salesMembers,
  transactions,
} from "@/db/schema";
import { addDays, addMonths } from "@/lib/dates";
import type { TargetPeriod, TargetRow } from "@/types/targets";

// Rentang tanggal transaksi yang dihitung sebagai pencapaian periode itu.
function achievementRange(period: TargetPeriod) {
  if (period.mode === "daily") return { from: period.date, to: period.date };
  const from = `${period.month}-01`;
  return { from, to: addDays(addMonths(from, 1), -1) };
}

// Target dan pencapaian tiap sales pada satu tanggal atau satu bulan.
// Sales aktif selalu tampil; sales nonaktif hanya kalau punya target atau
// penjualan di periode itu.
export async function getTargetBoard(
  userId: string,
  period: TargetPeriod,
): Promise<TargetRow[]> {
  const { from, to } = achievementRange(period);

  const target =
    period.mode === "daily"
      ? db
          .select({
            memberId: dailyTargets.salesMemberId,
            amount: dailyTargets.amount,
          })
          .from(dailyTargets)
          .where(
            and(
              eq(dailyTargets.userId, userId),
              eq(dailyTargets.date, period.date),
            ),
          )
          .as("target")
      : db
          .select({
            memberId: monthlyTargets.salesMemberId,
            amount: monthlyTargets.amount,
          })
          .from(monthlyTargets)
          .where(
            and(
              eq(monthlyTargets.userId, userId),
              eq(monthlyTargets.month, period.month),
            ),
          )
          .as("target");

  const achieved = db
    .select({
      memberId: transactions.salesMemberId,
      amount: sql`sum(${transactions.amount})`.as("achieved_amount"),
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
    .as("achieved");

  return db
    .select({
      salesId: salesMembers.id,
      name: salesMembers.name,
      target: sql`coalesce(${target.amount}, 0)`.mapWith(Number),
      achieved: sql`coalesce(${achieved.amount}, 0)`.mapWith(Number),
    })
    .from(salesMembers)
    .leftJoin(target, eq(target.memberId, salesMembers.id))
    .leftJoin(achieved, eq(achieved.memberId, salesMembers.id))
    .where(
      and(
        eq(salesMembers.userId, userId),
        or(
          eq(salesMembers.isActive, true),
          isNotNull(target.memberId),
          isNotNull(achieved.memberId),
        ),
      ),
    )
    .orderBy(asc(salesMembers.name), asc(salesMembers.id));
}

// Menyimpan target beberapa sales sekaligus untuk satu periode. Nominal 0
// menghapus target sales itu. Mengembalikan false kalau ada sales yang bukan
// milik akun ini; dalam kasus itu tidak ada yang disimpan.
export async function saveTargets(
  userId: string,
  period: TargetPeriod,
  items: { salesMemberId: string; amount: number }[],
) {
  const ids = [...new Set(items.map((item) => item.salesMemberId))];
  const owned = await db
    .select({ id: salesMembers.id })
    .from(salesMembers)
    .where(and(eq(salesMembers.userId, userId), inArray(salesMembers.id, ids)));
  if (owned.length !== ids.length) return false;

  await db.transaction(async (tx) => {
    for (const item of items) {
      if (period.mode === "daily") {
        if (item.amount > 0)
          await tx
            .insert(dailyTargets)
            .values({
              userId,
              salesMemberId: item.salesMemberId,
              date: period.date,
              amount: item.amount,
            })
            .onConflictDoUpdate({
              target: [dailyTargets.salesMemberId, dailyTargets.date],
              set: { amount: item.amount, updatedAt: new Date() },
            });
        else
          await tx
            .delete(dailyTargets)
            .where(
              and(
                eq(dailyTargets.userId, userId),
                eq(dailyTargets.salesMemberId, item.salesMemberId),
                eq(dailyTargets.date, period.date),
              ),
            );
      } else if (item.amount > 0)
        await tx
          .insert(monthlyTargets)
          .values({
            userId,
            salesMemberId: item.salesMemberId,
            month: period.month,
            amount: item.amount,
          })
          .onConflictDoUpdate({
            target: [monthlyTargets.salesMemberId, monthlyTargets.month],
            set: { amount: item.amount, updatedAt: new Date() },
          });
      else
        await tx
          .delete(monthlyTargets)
          .where(
            and(
              eq(monthlyTargets.userId, userId),
              eq(monthlyTargets.salesMemberId, item.salesMemberId),
              eq(monthlyTargets.month, period.month),
            ),
          );
    }
  });
  return true;
}
