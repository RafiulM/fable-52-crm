import { z } from "zod";
import { todayIso } from "@/lib/dates";

// Tanggal bisnis "YYYY-MM-DD" yang benar-benar ada di kalender.
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Gunakan format tanggal YYYY-MM-DD.")
  .refine(
    (value) =>
      !Number.isNaN(Date.parse(value + "T00:00:00Z")) &&
      new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value,
    "Tanggal tidak valid.",
  );

const salesMemberId = z.string().uuid();
const amount = z
  .number("Nominal harus berupa angka.")
  .int("Nominal harus bilangan bulat rupiah.")
  .min(1, "Nominal harus lebih dari Rp 0.")
  .max(999_999_999_999, "Nominal terlalu besar.");
const productDescription = z.string().trim().max(200);
const transactionDate = isoDateSchema.refine(
  (value) => value <= todayIso(),
  "Tanggal transaksi tidak boleh setelah hari ini.",
);

export const createTransactionSchema = z
  .object({
    salesMemberId,
    amount,
    productDescription: productDescription.default(""),
    transactionDate,
  })
  .strict();

export const updateTransactionSchema = z
  .object({
    salesMemberId: salesMemberId.optional(),
    amount: amount.optional(),
    productDescription: productDescription.optional(),
    transactionDate: transactionDate.optional(),
  })
  .strict()
  .refine(
    (value) => Object.values(value).some((field) => field !== undefined),
    "Sertakan minimal satu isian yang diubah.",
  );

export const transactionIdSchema = z.string().uuid();

export const listTransactionsSchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).max(1_000_000).default(0),
    salesMemberId: salesMemberId.optional(),
    // Cari di keterangan produk.
    q: z.string().trim().max(100).optional(),
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
  })
  .strict();

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type ListTransactionsInput = z.infer<typeof listTransactionsSchema>;
