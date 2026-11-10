import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { requireSession } from "@/lib/session";
import { getMockDashboard } from "@/mocks/dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  await requireSession();
  // Sementara memakai data tiruan; nanti diganti layanan dashboard.
  const data = getMockDashboard();
  return <DashboardView data={data} />;
}
