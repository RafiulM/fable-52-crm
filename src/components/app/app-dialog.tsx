"use client";

import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Dialog yang dibuka lewat state (bukan DialogTrigger). Radix hanya
// mengembalikan fokus ke DialogTrigger, jadi di sini kita ingat sendiri
// elemen yang membuka dialog dan memfokuskannya lagi saat dialog ditutup.
// Kalau elemen itu sudah hilang (mis. barisnya dihapus), fokus pindah ke
// `fallbackFocus`.
export function AppDialog({
  open,
  onOpenChange,
  title,
  description,
  fallbackFocus,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description: React.ReactNode;
  fallbackFocus?: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}) {
  const opener = useRef<HTMLElement | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[440px]"
        onOpenAutoFocus={() => {
          // Dipanggil sebelum fokus pindah ke dalam dialog.
          opener.current =
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null;
        }}
        onCloseAutoFocus={(event) => {
          const target = opener.current?.isConnected
            ? opener.current
            : fallbackFocus?.current;
          if (target) {
            event.preventDefault();
            target.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
