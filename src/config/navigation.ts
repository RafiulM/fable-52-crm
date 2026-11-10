import { LayoutDashboard, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

// Menu samping. Tambahkan halaman di sini saat halamannya sudah dibuat.
export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];
