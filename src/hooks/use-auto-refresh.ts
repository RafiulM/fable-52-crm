"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Memuat ulang data halaman dari server tanpa berpindah halaman:
// tiap `intervalMs` selama tab terlihat, dan setiap kali tab kembali aktif.
// Dengan begitu angka ikut berubah kalau ada pencatatan dari tab atau
// perangkat lain.
export function useAutoRefresh(intervalMs = 60_000) {
  const router = useRouter();

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = window.setInterval(refreshIfVisible, intervalMs);
    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("focus", refreshIfVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("focus", refreshIfVisible);
    };
  }, [router, intervalMs]);
}
