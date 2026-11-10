"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="mx-auto grid max-w-lg gap-4 px-6 py-24">
      <h1 className="text-[25px] leading-[1.2] font-medium">
        Halaman ini gagal dimuat
      </h1>
      <p className="text-muted-foreground">
        Coba muat ulang. Kalau masih gagal, periksa apakah database sedang
        berjalan, lalu lihat pesan di terminal tempat aplikasi dijalankan.
      </p>
      <div>
        <Button size="lg" onClick={reset}>
          Muat ulang
        </Button>
      </div>
    </main>
  );
}
