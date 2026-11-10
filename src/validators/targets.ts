import { z } from "zod";
import { isoDateSchema } from "@/validators/transactions";

export const monthKeySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Gunakan format bulan YYYY-MM.");

const targets = z
  .array(
    z
      .object({
        salesMemberId: z.string().uuid(),
        // 0 berarti hapus target sales itu untuk periode ini.
        amount: z
          .number("Target harus berupa angka.")
          .int("Target harus bilangan bulat rupiah.")
          .min(0, "Target tidak boleh negatif.")
          .max(999_999_999_999, "Target terlalu besar."),
      })
      .strict(),
  )
  .min(1, "Sertakan minimal satu target.")
  .max(200);

export const targetPeriodSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("daily"), date: isoDateSchema }).strict(),
  z.object({ mode: z.literal("monthly"), month: monthKeySchema }).strict(),
]);

export const saveTargetsSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("daily"), date: isoDateSchema, targets }).strict(),
  z
    .object({ mode: z.literal("monthly"), month: monthKeySchema, targets })
    .strict(),
]);

export type SaveTargetsInput = z.infer<typeof saveTargetsSchema>;
