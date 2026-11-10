import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { siteConfig } from "@/config/site";

// Lapis pertama proteksi halaman: pengunjung tanpa cookie sesi langsung
// dialihkan ke halaman masuk sebelum halaman dirender.
//
// Ini hanya cek cepat ada atau tidaknya cookie, bukan bukti sesi masih sah.
// Keabsahan sesi tetap diperiksa ke database oleh requireSession() di tiap
// halaman dan withApiSession() di tiap API. Jangan hapus pemeriksaan itu.
export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: siteConfig.cookiePrefix,
  });
  if (sessionCookie) return NextResponse.next();
  return NextResponse.redirect(new URL("/sign-in", request.url));
}

// Semua halaman di dalam aplikasi. Halaman masuk, daftar, dan API tidak
// termasuk: API menjawab 401 berformat JSON lewat withApiSession().
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transaksi/:path*",
    "/leads/:path*",
    "/target/:path*",
    "/laporan/:path*",
    "/tim/:path*",
    "/pengaturan/:path*",
    "/app/:path*",
    "/admin/:path*",
  ],
};
