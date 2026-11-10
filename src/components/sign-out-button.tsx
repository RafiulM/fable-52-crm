"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

// `compact` menampilkan ikon saja, untuk menu samping.
export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();
  async function signOut() {
    setPending(true);
    setError(false);
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error("Sign out failed");
      router.replace("/sign-in");
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          Gagal keluar. Coba lagi.
        </p>
      )}
      {compact ? (
        <Button
          onClick={signOut}
          disabled={pending}
          variant="ghost"
          size="icon"
          aria-label="Keluar dari akun"
          title="Keluar"
        >
          <LogOut aria-hidden="true" />
        </Button>
      ) : (
        <Button onClick={signOut} disabled={pending} variant="outline">
          <LogOut aria-hidden="true" />
          {pending ? "Sedang keluar…" : "Keluar dari akun"}
        </Button>
      )}
    </div>
  );
}
