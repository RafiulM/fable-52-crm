"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "cn";
import { navItems } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { SignOutButton } from "@/components/sign-out-button";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

// Kerangka semua halaman setelah masuk: menu samping di layar lebar,
// bilah atas dengan tombol menu di layar sempit.
export function AppShell({
  userName,
  teamName,
  children,
}: {
  userName: string;
  teamName: string;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const navId = useId();

  return (
    <div className="min-h-svh md:grid md:grid-cols-[232px_minmax(0,1fr)] md:items-start">
      <aside className="border-b bg-card md:sticky md:top-0 md:flex md:h-svh md:flex-col md:gap-6 md:overflow-y-auto md:border-r md:border-b-0 md:px-3 md:py-6">
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-3 md:py-0">
          <div className="min-w-0">
            <p className="text-lg leading-snug font-medium">{siteConfig.name}</p>
            <p className="truncate text-[13px] text-muted-foreground">
              {teamName}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-sm border border-border-strong bg-card outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 md:hidden"
            aria-expanded={menuOpen}
            aria-controls={navId}
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <X className="size-[18px]" aria-hidden="true" />
            ) : (
              <Menu className="size-[18px]" aria-hidden="true" />
            )}
          </button>
        </div>

        <div
          id={navId}
          className={cn(
            "flex-1 flex-col gap-6 px-1 pb-3 md:flex md:px-0 md:pb-0",
            menuOpen ? "flex" : "hidden",
          )}
        >
          <nav aria-label="Navigasi utama">
            <ul className="grid gap-1">
              {navItems.map((item) => {
                const current =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={current ? "page" : undefined}
                      onClick={() => setMenuOpen(false)}
                      className="relative flex items-center gap-3 overflow-hidden rounded-sm px-3 py-2 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-[current=page]:bg-primary-quiet aria-[current=page]:font-semibold aria-[current=page]:before:absolute aria-[current=page]:before:inset-y-0 aria-[current=page]:before:left-0 aria-[current=page]:before:w-1 aria-[current=page]:before:bg-primary"
                    >
                      <item.icon className="size-[18px]" aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-auto flex items-center gap-3 border-t px-3 pt-4">
            <span
              aria-hidden="true"
              className="flex size-9 flex-none items-center justify-center rounded-full bg-muted text-[13px] font-semibold"
            >
              {initials(userName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{userName}</p>
              <p className="text-[13px] text-muted-foreground">Pemilik tim</p>
            </div>
            <SignOutButton compact />
          </div>
        </div>
      </aside>

      <main id="main-content" className="min-w-0 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
