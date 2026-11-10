import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { salesMembers } from "@/db/schema";

// Anggota aktif milik akun ini, untuk pilihan di form transaksi dan leads.
export async function listActiveSalesMembers(userId: string) {
  return db
    .select({ id: salesMembers.id, name: salesMembers.name })
    .from(salesMembers)
    .where(
      and(eq(salesMembers.userId, userId), eq(salesMembers.isActive, true)),
    )
    .orderBy(asc(salesMembers.name), asc(salesMembers.id));
}

// Benar kalau anggota itu milik akun ini dan masih aktif.
export async function isActiveSalesMember(userId: string, id: string) {
  const [member] = await db
    .select({ id: salesMembers.id })
    .from(salesMembers)
    .where(
      and(
        eq(salesMembers.id, id),
        eq(salesMembers.userId, userId),
        eq(salesMembers.isActive, true),
      ),
    )
    .limit(1);
  return Boolean(member);
}
