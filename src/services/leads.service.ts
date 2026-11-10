import "server-only";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import { leads, salesMembers } from "@/db/schema";
import { WON_STATUS } from "@/lib/lead-status";
import { isActiveSalesMember } from "@/services/sales-members.service";
import type {
  CreateLeadInput,
  ListLeadsInput,
  UpdateLeadInput,
} from "@/validators/leads";

// Kolom yang boleh keluar ke klien. Pemilik data datang dari sesi.
const fields = {
  id: leads.id,
  salesMemberId: leads.salesMemberId,
  salesName: salesMembers.name,
  name: leads.name,
  contact: leads.contact,
  status: leads.status,
  notes: leads.notes,
  leadDate: leads.leadDate,
  createdAt: leads.createdAt,
  updatedAt: leads.updatedAt,
};

function likePattern(text: string) {
  return `%${text.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

// Daftar leads milik akun ini dengan filter sales, status, dan kata cari.
// `meta.total` menghitung semua lead yang cocok, bukan hanya halaman ini.
export async function listLeads(userId: string, input: ListLeadsInput) {
  const where = and(
    eq(leads.userId, userId),
    input.salesMemberId
      ? eq(leads.salesMemberId, input.salesMemberId)
      : undefined,
    input.status ? eq(leads.status, input.status) : undefined,
    input.q
      ? or(
          ilike(leads.name, likePattern(input.q)),
          ilike(leads.contact, likePattern(input.q)),
        )
      : undefined,
  );
  const recent = [desc(leads.leadDate), desc(leads.createdAt), desc(leads.id)];
  const [rows, [summary], bySales] = await Promise.all([
    db
      .select(fields)
      .from(leads)
      .innerJoin(salesMembers, eq(salesMembers.id, leads.salesMemberId))
      .where(where)
      .orderBy(
        ...(input.sort === "sales"
          ? [asc(salesMembers.name), asc(salesMembers.id), ...recent]
          : recent),
      )
      .limit(input.limit + 1)
      .offset(input.offset),
    db
      .select({ total: sql`count(*)`.mapWith(Number) })
      .from(leads)
      .where(where),
    // Jumlah per sales atas semua lead yang cocok dengan filter, untuk judul
    // kelompok di daftar (halaman yang dikirim bisa hanya sebagian).
    db
      .select({
        salesMemberId: leads.salesMemberId,
        total: sql`count(*)`.mapWith(Number),
        won: sql`count(*) filter (where ${leads.status} = ${WON_STATUS})`.mapWith(
          Number,
        ),
      })
      .from(leads)
      .where(where)
      .groupBy(leads.salesMemberId),
  ]);
  return {
    data: rows.slice(0, input.limit),
    meta: {
      limit: input.limit,
      offset: input.offset,
      hasMore: rows.length > input.limit,
      total: summary.total,
      bySales,
    },
  };
}

export async function getLead(userId: string, id: string) {
  const [row] = await db
    .select(fields)
    .from(leads)
    .innerJoin(salesMembers, eq(salesMembers.id, leads.salesMemberId))
    .where(and(eq(leads.id, id), eq(leads.userId, userId)))
    .limit(1);
  return row;
}

// Mengembalikan null kalau sales bukan milik akun ini atau sudah nonaktif.
export async function createLead(
  userId: string,
  input: CreateLeadInput,
  today: string,
) {
  if (!(await isActiveSalesMember(userId, input.salesMemberId))) return null;
  const [created] = await db
    .insert(leads)
    .values({
      userId,
      salesMemberId: input.salesMemberId,
      name: input.name,
      contact: input.contact,
      status: input.status,
      notes: input.notes,
      leadDate: input.leadDate ?? today,
    })
    .returning({ id: leads.id });
  return getLead(userId, created.id);
}

export type UpdateLeadResult =
  | { status: "ok"; lead: Awaited<ReturnType<typeof getLead>> }
  | { status: "not_found" }
  | { status: "sales_member_unavailable" };

// Mengubah status atau data lead. Memindahkan lead ke sales lain hanya boleh
// ke sales yang aktif.
export async function updateLead(
  userId: string,
  id: string,
  input: UpdateLeadInput,
): Promise<UpdateLeadResult> {
  const current = await getLead(userId, id);
  if (!current) return { status: "not_found" };
  if (
    input.salesMemberId &&
    input.salesMemberId !== current.salesMemberId &&
    !(await isActiveSalesMember(userId, input.salesMemberId))
  )
    return { status: "sales_member_unavailable" };

  const [updated] = await db
    .update(leads)
    .set({
      salesMemberId: input.salesMemberId,
      name: input.name,
      contact: input.contact,
      status: input.status,
      notes: input.notes,
    })
    .where(and(eq(leads.id, id), eq(leads.userId, userId)))
    .returning({ id: leads.id });
  if (!updated) return { status: "not_found" };
  return { status: "ok", lead: await getLead(userId, id) };
}

// Konversi tiap sales: jumlah leads yang masuk pada rentang tanggal dan
// berapa yang berstatus jadi beli. Tanpa rentang berarti sepanjang waktu.
// Sales aktif selalu tampil; sales nonaktif hanya kalau punya lead di rentang itu.
export async function getLeadConversion(
  userId: string,
  range?: { from: string; to: string },
) {
  const counts = db
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
        range ? gte(leads.leadDate, range.from) : undefined,
        range ? lte(leads.leadDate, range.to) : undefined,
      ),
    )
    .groupBy(leads.salesMemberId)
    .as("counts");

  return db
    .select({
      salesId: salesMembers.id,
      name: salesMembers.name,
      total: sql`coalesce(${counts.total}, 0)`.mapWith(Number),
      won: sql`coalesce(${counts.won}, 0)`.mapWith(Number),
    })
    .from(salesMembers)
    .leftJoin(counts, eq(counts.memberId, salesMembers.id))
    .where(
      and(
        eq(salesMembers.userId, userId),
        or(eq(salesMembers.isActive, true), isNotNull(counts.memberId)),
      ),
    )
    .orderBy(asc(salesMembers.name), asc(salesMembers.id));
}
