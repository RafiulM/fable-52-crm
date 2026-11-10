"use client";

import { useState } from "react";
import { AppDialog } from "@/components/app/app-dialog";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/client-api";

// Dialog konfirmasi untuk aksi yang tidak bisa dibatalkan (hapus, nonaktifkan).
// Tombol "Batal" berada lebih dulu, jadi fokus awal jatuh ke pilihan yang aman.
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pendingLabel,
  onConfirm,
  fallbackFocus,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description: React.ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  onConfirm: () => Promise<void>;
  fallbackFocus?: React.RefObject<HTMLElement | null>;
  children?: React.ReactNode;
}) {
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState("");

  async function confirm() {
    if (pending) return;
    setPending(true);
    setFailure("");
    try {
      await onConfirm();
    } catch (error) {
      setFailure(errorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setFailure("");
        onOpenChange(next);
      }}
      title={title}
      description={description}
      fallbackFocus={fallbackFocus}
    >
      {children}
      {failure && (
        <p role="alert" className="text-[13px] text-destructive">
          {failure}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-3 pt-1">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => onOpenChange(false)}
        >
          Batal
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="lg"
          disabled={pending}
          onClick={confirm}
        >
          {pending ? pendingLabel : confirmLabel}
        </Button>
      </div>
    </AppDialog>
  );
}
