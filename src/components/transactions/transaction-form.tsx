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
import { errorMessage } from "@/lib/client-api";
import type { SalesMemberOption } from "@/types/dashboard";
import type { TransactionInput } from "@/types/transactions";

// Form transaksi untuk tambah maupun ubah. `initial` mengisi form saat
// mengubah; tanpa itu form kosong dengan tanggal hari ini. Setelah berhasil
// menambah, form dikosongkan dan fokus kembali ke pilihan sales supaya bisa
// langsung mencatat transaksi berikutnya.
export function TransactionFormCard({
  salesMembers,
  today,
  initial,
  submitLabel,
  pendingLabel = "Menyimpan…",
  resetAfterSubmit = false,
  onSubmit,
  onCancel,
}: {
  salesMembers: SalesMemberOption[];
  today: string;
  initial?: TransactionForm;
  submitLabel: string;
  pendingLabel?: string;
  resetAfterSubmit?: boolean;
  onSubmit: (input: TransactionInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const formId = useId();
  const [form, setForm] = useState<TransactionForm>(
    () => initial ?? emptyTransactionForm(today),
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
        salesMemberId: form.salesId,
        amount: transactionAmount(form),
        productDescription: form.product.trim(),
        transactionDate: form.date,
      });
      if (resetAfterSubmit) {
        setForm(emptyTransactionForm(today));
        document.getElementById(`${formId}-salesId`)?.focus();
      }
    } catch (error) {
      setFailure(errorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      noValidate
      method="post"
      onSubmit={handleSubmit}
      className="grid gap-4"
    >
      <TransactionFields
        idPrefix={formId}
        form={form}
        errors={errors}
        salesMembers={salesMembers}
        today={today}
        onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
      />
      {failure && (
        <p role="alert" className="text-[13px] text-destructive">
          {failure}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-3 pt-1">
        {onCancel && (
          <Button type="button" variant="outline" size="lg" onClick={onCancel}>
            Batal
          </Button>
        )}
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className={onCancel ? undefined : "w-full"}
        >
          {pending ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
