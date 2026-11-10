import { z } from "zod";
import { diffDays, todayIso } from "@/lib/dates";
import { isoDateSchema } from "@/validators/transactions";

// period=today|week|month memakai rentang berjalan sampai hari ini.
// period=custom butuh from dan to (maksimal 366 hari, tidak melewati hari ini).
export const reportQuerySchema = z
  .object({
    period: z.enum(["today", "week", "month", "custom"]).default("week"),
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.period !== "custom") return;
    if (!value.from || !value.to) {
      context.addIssue({
        code: "custom",
        path: [value.from ? "to" : "from"],
        message: "Isi tanggal mulai dan tanggal akhir.",
      });
      return;
    }
    if (value.from > value.to)
      context.addIssue({
        code: "custom",
        path: ["from"],
        message: "Tanggal mulai harus sebelum atau sama dengan tanggal akhir.",
      });
    else if (diffDays(value.from, value.to) > 365)
      context.addIssue({
        code: "custom",
        path: ["to"],
        message: "Rentang laporan paling lama 366 hari.",
      });
    if (value.to > todayIso())
      context.addIssue({
        code: "custom",
        path: ["to"],
        message: "Tanggal akhir tidak boleh setelah hari ini.",
      });
  });

export type ReportQuery = z.infer<typeof reportQuerySchema>;
