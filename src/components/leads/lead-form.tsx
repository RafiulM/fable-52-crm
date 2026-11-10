"use client";

import { useId, useState, type FormEvent } from "react";
import { Field, fieldAria, NativeSelect } from "@/components/app/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage } from "@/lib/client-api";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type LeadStatus,
} from "@/lib/lead-status";
import type { SalesMemberOption } from "@/types/dashboard";
import type { LeadInput } from "@/types/leads";

type Errors = Partial<Record<"name" | "salesMemberId", string>>;

// Form lead baru: nama calon pembeli, kontak, sales penanggung jawab,
// status, dan catatan.
export function LeadForm({
  salesMembers,
  onSubmit,
  onCancel,
}: {
  salesMembers: SalesMemberOption[];
  onSubmit: (input: LeadInput) => Promise<void>;
  onCancel: () => void;
}) {
  const id = useId();
  const [form, setForm] = useState<LeadInput>({
    salesMemberId: "",
    name: "",
    contact: "",
    status: "baru",
    notes: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState("");

  function patch(next: Partial<LeadInput>) {
    setForm((current) => ({ ...current, ...next }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const nextErrors: Errors = {};
    if (!form.name.trim()) nextErrors.name = "Isi nama calon pembeli.";
    if (!form.salesMemberId)
      nextErrors.salesMemberId = "Pilih sales penanggung jawab.";
    setErrors(nextErrors);
    const firstInvalid = (["name", "salesMemberId"] as const).find(
      (field) => nextErrors[field],
    );
    if (firstInvalid) {
      document.getElementById(`${id}-${firstInvalid}`)?.focus();
      return;
    }

    setPending(true);
    setFailure("");
    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        contact: form.contact.trim(),
        notes: form.notes.trim(),
      });
    } catch (error) {
      setFailure(errorMessage(error));
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
      <Field id={`${id}-name`} label="Nama calon pembeli" error={errors.name}>
        <Input
          id={`${id}-name`}
          name="name"
          autoComplete="off"
          maxLength={160}
          value={form.name}
          onChange={(event) => patch({ name: event.target.value })}
          {...fieldAria(`${id}-name`, undefined, errors.name)}
        />
      </Field>

      <Field
        id={`${id}-contact`}
        label="Kontak"
        hint="Opsional. Nomor HP, WhatsApp, atau akun media sosial."
      >
        <Input
          id={`${id}-contact`}
          name="contact"
          autoComplete="off"
          maxLength={160}
          value={form.contact}
          onChange={(event) => patch({ contact: event.target.value })}
          {...fieldAria(`${id}-contact`, true)}
        />
      </Field>

      <Field
        id={`${id}-salesMemberId`}
        label="Sales penanggung jawab"
        error={errors.salesMemberId}
      >
        <NativeSelect
          id={`${id}-salesMemberId`}
          name="salesMemberId"
          value={form.salesMemberId}
          onChange={(event) => patch({ salesMemberId: event.target.value })}
          {...fieldAria(`${id}-salesMemberId`, undefined, errors.salesMemberId)}
        >
          <option value="">Pilih sales</option>
          {salesMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field id={`${id}-status`} label="Status">
        <NativeSelect
          id={`${id}-status`}
          name="status"
          value={form.status}
          onChange={(event) =>
            patch({ status: event.target.value as LeadStatus })
          }
        >
          {LEAD_STATUSES.map((status) => (
            <option key={status} value={status}>
              {LEAD_STATUS_LABELS[status]}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field id={`${id}-notes`} label="Catatan">
        <Textarea
          id={`${id}-notes`}
          name="notes"
          rows={3}
          maxLength={2000}
          value={form.notes}
          onChange={(event) => patch({ notes: event.target.value })}
        />
      </Field>

      {failure && (
        <p role="alert" className="text-[13px] text-destructive">
          {failure}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-3 pt-1">
        <Button type="button" variant="outline" size="lg" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan lead"}
        </Button>
      </div>
    </form>
  );
}
