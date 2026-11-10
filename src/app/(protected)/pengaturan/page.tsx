import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SettingsView } from "@/components/settings/settings-view";
import { requireSession } from "@/lib/session";
import { getProfile } from "@/services/profile.service";

export const metadata: Metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  const { user } = await requireSession();
  const profile = await getProfile(user.id);
  if (!profile) notFound();
  return <SettingsView initialProfile={profile} />;
}
