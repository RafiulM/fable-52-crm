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

export const transactionIdSchema = z.string().uuid();

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
