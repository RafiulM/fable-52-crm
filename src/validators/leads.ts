import { z } from "zod";
import { todayIso } from "@/lib/dates";
import { LEAD_STATUSES } from "@/lib/lead-status";
import { isoDateSchema } from "@/validators/transactions";

const salesMemberId = z.string().uuid();
const name = z
  .string()
  .trim()
  .min(1, "Isi nama calon pembeli.")
  .max(160, "Nama terlalu panjang.");
const contact = z.string().trim().max(160);
const status = z.enum(LEAD_STATUSES);
const notes = z.string().trim().max(2000);
const leadDate = isoDateSchema.refine(
  (value) => value <= todayIso(),
  "Tanggal lead tidak boleh setelah hari ini.",
);

export const createLeadSchema = z
  .object({
    salesMemberId,
    name,
    contact: contact.default(""),
    status: status.default("baru"),
    notes: notes.default(""),
    // Tanggal lead masuk; kosong berarti hari ini.
    leadDate: leadDate.optional(),
  })
  .strict();

export const updateLeadSchema = z
  .object({
    salesMemberId: salesMemberId.optional(),
    name: name.optional(),
    contact: contact.optional(),
    status: status.optional(),
    notes: notes.optional(),
  })
  .strict()
  .refine(
    (value) => Object.values(value).some((field) => field !== undefined),
    "Sertakan minimal satu isian yang diubah.",
  );

export const leadIdSchema = z.string().uuid();

export const listLeadsSchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(200).default(100),
    offset: z.coerce.number().int().min(0).max(1_000_000).default(0),
    salesMemberId: salesMemberId.optional(),
    status: status.optional(),
    // Cari di nama atau kontak.
    q: z.string().trim().max(100).optional(),
    // "sales": urut nama sales lalu terbaru; "recent": terbaru dulu.
    sort: z.enum(["recent", "sales"]).default("recent"),
  })
  .strict();

export const leadConversionSchema = z
  .object({ period: z.enum(["month", "all"]).default("month") })
  .strict();

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type ListLeadsInput = z.infer<typeof listLeadsSchema>;
