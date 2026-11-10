"use client";

import { useId, useState, type FormEvent } from "react";
import {
  emptyTransactionForm,
  focusFirstError,
  transactionAmount,
  TransactionFields,
  validateTransactionForm,
  type TransactionForm,
  type TransactionFormErrors,
} from "@/components/transactions/transaction-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SalesMemberOption } from "@/types/dashboard";

export type RecordSaleInput = {
  salesId: string;
  amount: number;
  product: string;
};

function RecordSaleForm({
  salesMembers,
  today,
  onSubmit,
  onCancel,
}: {
  salesMembers: SalesMemberOption[];
  today: string;
  onSubmit: (input: RecordSaleInput) => Promise<void>;
  onCancel: () => void;
}) {
  const formId = useId();
  const [form, setForm] = useState<TransactionForm>(() =>
    emptyTransactionForm(today),
  );
  const [errors, setErrors] = useState<TransactionFormErrors>({});
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const nextErrors = validateTransactionForm(form, today);
    setErrors(nextErrors);
    if (focusFirstError(formId, nextErrors)) return;

    setPending(true);
    setFailure("");
    try {
      await onSubmit({
        salesId: form.salesId,
        amount: transactionAmount(form),
        product: form.product.trim(),
      });
    } catch (error) {
      setFailure(
        error instanceof Error && error.message
          ? error.message
          : "Transaksi belum tersimpan. Coba lagi.",
      );
      setPending(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="grid gap-4">
      <TransactionFields
        idPrefix={formId}
        form={form}
        errors={errors}
        salesMembers={salesMembers}
        today={today}
        showDate={false}
        onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
      />
      {failure && (
        <p role="alert" className="text-[13px] text-destructive">
          {failure}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan transaksi"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Dialog catat penjualan cepat dari dashboard, untuk transaksi hari ini.
export function RecordSaleDialog({
  open,
  onOpenChange,
  salesMembers,
  today,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesMembers: SalesMemberOption[];
  today: string;
  onSubmit: (input: RecordSaleInput) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Catat penjualan</DialogTitle>
          <DialogDescription>
            Transaksi dicatat untuk hari ini dan langsung masuk ke dashboard.
          </DialogDescription>
        </DialogHeader>
        {salesMembers.length > 0 ? (
          <RecordSaleForm
            salesMembers={salesMembers}
            today={today}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        ) : (
          <p className="text-muted-foreground">
            Belum ada anggota tim sales yang aktif. Tambahkan anggota dulu
            sebelum mencatat penjualan.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
