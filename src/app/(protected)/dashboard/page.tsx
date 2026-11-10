import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { todayIso } from "@/lib/dates";
import { requireSession } from "@/lib/session";
import { getDashboard } from "@/services/dashboard.service";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { user } = await requireSession();
  const data = await getDashboard(user.id, todayIso());
  return <DashboardView data={data} />;
}
