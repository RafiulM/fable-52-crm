import type { Metadata } from "next";
import { LeadsView } from "@/components/leads/leads-view";
import { periodRange, todayIso } from "@/lib/dates";
import { requireSession } from "@/lib/session";
import { getLeadConversion, listLeads } from "@/services/leads.service";
import { listSalesMembers } from "@/services/sales-members.service";

export const metadata: Metadata = { title: "Leads & Kontak" };

export default async function LeadsPage() {
  const { user } = await requireSession();
  const today = todayIso();
  const [list, conversion, members] = await Promise.all([
    listLeads(user.id, { limit: 100, offset: 0, sort: "sales" }),
    getLeadConversion(user.id, periodRange("month", today)),
    listSalesMembers(user.id),
  ]);

  return (
    <LeadsView
      initialLeads={list.data.map((lead) => ({
        id: lead.id,
        salesMemberId: lead.salesMemberId,
        salesName: lead.salesName,
        name: lead.name,
        contact: lead.contact,
        status: lead.status,
        notes: lead.notes,
        leadDate: lead.leadDate,
        updatedAt: lead.updatedAt.toISOString(),
      }))}
      initialMeta={list.meta}
      initialConversion={conversion}
      salesMembers={members
        .filter((member) => member.isActive)
        .map(({ id, name }) => ({ id, name }))}
      filterMembers={members.map(({ id, name }) => ({ id, name }))}
      today={today}
    />
  );
}
