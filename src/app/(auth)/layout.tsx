import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { siteConfig } from "@/config/site";

// Halaman masuk dan daftar. Kalau sudah masuk, langsung ke dashboard.
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (await getSession()) redirect(siteConfig.homePath);
  return (
    <main
      id="main-content"
      className="grid min-h-svh place-items-center px-4 py-6"
    >
      {children}
    </main>
  );
}
