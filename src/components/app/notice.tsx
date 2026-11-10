"use client";

import { CircleAlert, CircleCheck, X } from "lucide-react";

export type NoticeState = { tone: "success" | "error"; message: string } | null;

// Pemberitahuan hasil aksi (tersimpan, dihapus, gagal). Wadah role="status"
// selalu ada di halaman supaya pembaca layar ikut mengumumkannya.
export function Notice({
  notice,
  onDismiss,
}: {
  notice: NoticeState;
  onDismiss: () => void;
}) {
  return (
    <div role="status">
      {notice && (
        <div className="flex items-center gap-3 rounded-lg border border-border-strong bg-card py-2 pr-2 pl-4">
          {notice.tone === "success" ? (
            <CircleCheck
              className="size-[18px] flex-none text-positive"
              aria-hidden="true"
            />
          ) : (
            <CircleAlert
              className="size-[18px] flex-none text-destructive"
              aria-hidden="true"
            />
          )}
          <p className="min-w-0 flex-1">{notice.message}</p>
          <button
            type="button"
            aria-label="Tutup pemberitahuan"
            onClick={onDismiss}
            className="inline-flex size-8 flex-none items-center justify-center rounded-sm outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <X className="size-[18px]" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
