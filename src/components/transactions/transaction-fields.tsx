"use client";

import { useId } from "react";
import {
  Field,
  fieldAria,
  MoneyInput,
  NativeSelect,
} from "@/components/app/field";
import { Input } from "@/components/ui/input";
import { onlyDigits } from "@/lib/format";
import type { SalesMemberOption } from "@/types/dashboard";

export type TransactionForm = {
  salesId: string;
  date: string;
  // Teks berformat ribuan, mis. "2.750.000".
  amount: string;
  product: string;
};

export type TransactionFormErrors = Partial<
  Record<"salesId" | "date" | "amount", string>
>;

export function emptyTransactionForm(today: string): TransactionForm {
  return { salesId: "", date: today, amount: "", product: "" };
}

export function transactionAmount(form: TransactionForm) {
  return Number(onlyDigits(form.amount));
}

export function validateTransactionForm(
  form: TransactionForm,
  today: string,
): TransactionFormErrors {
  const errors: TransactionFormErrors = {};
  if (!form.salesId) errors.salesId = "Pilih sales yang melakukan penjualan.";
  if (!form.date) errors.date = "Isi tanggal transaksi.";
  else if (form.date > today)
    errors.date = "Tanggal transaksi tidak boleh setelah hari ini.";
  if (transactionAmount(form) <= 0)
    errors.amount = "Isi nominal penjualan lebih dari Rp 0.";
  return errors;
}

// Isian transaksi yang dipakai di dialog dashboard dan halaman Catat Penjualan.
// Kontrol yang salah diberi id `${formId}-<nama>` supaya bisa difokuskan.
export function TransactionFields({
  form,
  errors,
  salesMembers,
  today,
  showDate = true,
  onChange,
  idPrefix,
}: {
  form: TransactionForm;
  errors: TransactionFormErrors;
  salesMembers: SalesMemberOption[];
  today: string;
  showDate?: boolean;
  onChange: (patch: Partial<TransactionForm>) => void;
  idPrefix?: string;
}) {
  const generated = useId();
  const id = idPrefix ?? generated;

  return (
    <>
      <Field id={`${id}-salesId`} label="Sales" error={errors.salesId}>
        <NativeSelect
          id={`${id}-salesId`}
          name="salesId"
          value={form.salesId}
          onChange={(event) => onChange({ salesId: event.target.value })}
          {...fieldAria(`${id}-salesId`, undefined, errors.salesId)}
        >
          <option value="">Pilih sales</option>
          {salesMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </NativeSelect>
      </Field>

      {showDate && (
        <Field id={`${id}-date`} label="Tanggal transaksi" error={errors.date}>
          <Input
            id={`${id}-date`}
            name="date"
            type="date"
            max={today}
            value={form.date}
            onChange={(event) => onChange({ date: event.target.value })}
            {...fieldAria(`${id}-date`, undefined, errors.date)}
          />
        </Field>
      )}

      <Field id={`${id}-amount`} label="Nominal penjualan" error={errors.amount}>
        <MoneyInput
          id={`${id}-amount`}
          name="amount"
          value={form.amount}
          onValueChange={(amount) => onChange({ amount })}
          {...fieldAria(`${id}-amount`, undefined, errors.amount)}
        />
      </Field>

      <Field
        id={`${id}-product`}
        label="Produk atau keterangan"
        hint="Opsional, misalnya nama paket yang dibeli."
      >
        <Input
          id={`${id}-product`}
          name="product"
          autoComplete="off"
          maxLength={200}
          value={form.product}
          onChange={(event) => onChange({ product: event.target.value })}
          {...fieldAria(`${id}-product`, true)}
        />
      </Field>
    </>
  );
}

// Fokus ke isian pertama yang salah. Mengembalikan true kalau ada yang salah.
export function focusFirstError(
  idPrefix: string,
  errors: TransactionFormErrors,
) {
  const first = (["salesId", "date", "amount"] as const).find(
    (name) => errors[name],
  );
  if (!first) return false;
  document.getElementById(`${idPrefix}-${first}`)?.focus();
  return true;
}
