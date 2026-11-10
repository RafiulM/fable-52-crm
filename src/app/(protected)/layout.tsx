import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireSession();
  return (
    <AppShell userName={user.name} teamName="Tim Sales">
      {children}
    </AppShell>
  );
}
