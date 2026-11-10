import { redirect } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getSession } from "@/lib/session";

// Alamat utama: ke dashboard kalau sudah masuk, ke halaman masuk kalau belum.
export default async function Home() {
  redirect((await getSession()) ? siteConfig.homePath : "/sign-in");
}
