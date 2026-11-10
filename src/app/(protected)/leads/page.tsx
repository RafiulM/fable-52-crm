import type { Metadata } from "next";
import { LeadsView } from "@/components/leads/leads-view";
import { todayIso } from "@/lib/dates";
import { requireSession } from "@/lib/session";
import { getMockLeads } from "@/mocks/leads";
import { MOCK_SALES_MEMBERS } from "@/mocks/transactions";

export const metadata: Metadata = { title: "Leads & Kontak" };

export default async function LeadsPage() {
  await requireSession();
  // Sementara memakai data tiruan; nanti diganti layanan leads.
  return (
    <LeadsView
      initialLeads={getMockLeads()}
      salesMembers={MOCK_SALES_MEMBERS}
      today={todayIso()}
    />
  );
}
