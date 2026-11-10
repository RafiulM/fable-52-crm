import {
  Contact,
  LayoutDashboard,
  ReceiptText,
  Target,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

// Menu samping. Tambahkan halaman di sini saat halamannya sudah dibuat.
export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transaksi", label: "Catat Penjualan", icon: ReceiptText },
  { href: "/leads", label: "Leads & Kontak", icon: Contact },
  { href: "/target", label: "Target", icon: Target },
];
