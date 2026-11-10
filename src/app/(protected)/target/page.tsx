import type { Metadata } from "next";
import { TargetView } from "@/components/targets/target-view";
import { todayIso } from "@/lib/dates";
import { requireSession } from "@/lib/session";
import { getTargetBoard } from "@/services/targets.service";

export const metadata: Metadata = { title: "Target" };

export default async function TargetPage() {
  const { user } = await requireSession();
  const today = todayIso();
  const rows = await getTargetBoard(user.id, { mode: "daily", date: today });
  return <TargetView initialRows={rows} today={today} />;
}
