import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { salesMembers } from "@/db/schema";
import type {
  CreateSalesMemberInput,
  UpdateSalesMemberInput,
} from "@/validators/sales-members";

// Kolom yang boleh keluar ke klien. Pemilik data datang dari sesi.
const fields = {
  id: salesMembers.id,
  name: salesMembers.name,
  phone: salesMembers.phone,
  isActive: salesMembers.isActive,
  createdAt: salesMembers.createdAt,
};

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

// Semua anggota milik akun ini: yang aktif dulu, lalu urut nama.
export async function listSalesMembers(userId: string) {
  return db
    .select(fields)
    .from(salesMembers)
    .where(eq(salesMembers.userId, userId))
    .orderBy(
      desc(salesMembers.isActive),
      asc(salesMembers.name),
      asc(salesMembers.id),
    );
}

export async function createSalesMember(
  userId: string,
  input: CreateSalesMemberInput,
) {
  const [member] = await db
    .insert(salesMembers)
    .values({ userId, name: input.name, phone: input.phone })
    .returning(fields);
  return member;
}

// Mengubah nama/telepon, menonaktifkan, atau mengaktifkan kembali. Anggota
// tidak pernah dihapus, supaya riwayat penjualan dan leads-nya tetap utuh.
export async function updateSalesMember(
  userId: string,
  id: string,
  input: UpdateSalesMemberInput,
) {
  const [member] = await db
    .update(salesMembers)
    .set({ name: input.name, phone: input.phone, isActive: input.isActive })
    .where(and(eq(salesMembers.id, id), eq(salesMembers.userId, userId)))
    .returning(fields);
  return member;
}
