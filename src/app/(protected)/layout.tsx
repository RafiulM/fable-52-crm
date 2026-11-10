import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/session";
import { DEFAULT_TEAM_NAME, getProfile } from "@/services/profile.service";

export const runtime = "nodejs";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireSession();
  const profile = await getProfile(user.id);
  return (
    <AppShell
      userName={profile?.name ?? user.name}
      teamName={profile?.teamName ?? DEFAULT_TEAM_NAME}
    >
      {children}
    </AppShell>
  );
}
