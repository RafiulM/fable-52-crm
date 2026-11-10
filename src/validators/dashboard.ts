import { z } from "zod";

export const dashboardPeriodSchema = z
  .object({ period: z.enum(["today", "week", "month"]).default("today") })
  .strict();

export type DashboardPeriodInput = z.infer<typeof dashboardPeriodSchema>;
