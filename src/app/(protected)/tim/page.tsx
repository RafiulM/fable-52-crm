import type { Metadata } from "next";
import { TeamView } from "@/components/team/team-view";
import { requireSession } from "@/lib/session";
import { listSalesMembers } from "@/services/sales-members.service";

export const metadata: Metadata = { title: "Tim Sales" };

export default async function TeamPage() {
  const { user } = await requireSession();
  const members = await listSalesMembers(user.id);
  return (
    <TeamView
      initialMembers={members.map((member) => ({
        ...member,
        createdAt: member.createdAt.toISOString(),
      }))}
    />
  );
}
