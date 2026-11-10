import type { Metadata } from "next";
import { ReportView } from "@/components/reports/report-view";
import { todayIso } from "@/lib/dates";
import { requireSession } from "@/lib/session";
import { getReport } from "@/services/reports.service";

export const metadata: Metadata = { title: "Laporan" };

export default async function ReportPage() {
  const { user } = await requireSession();
  const today = todayIso();
  const report = await getReport(user.id, "week", today);
  return <ReportView initialReport={report} today={today} />;
}
