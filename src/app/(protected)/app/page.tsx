import { redirect } from "next/navigation";
import { siteConfig } from "@/config/site";

// Alamat lama dari starter. Halaman utama aplikasi sekarang dashboard.
export default function AppPage() {
  redirect(siteConfig.homePath);
}
