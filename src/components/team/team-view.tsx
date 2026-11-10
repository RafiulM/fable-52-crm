"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, CircleSlash, Plus } from "lucide-react";
import { AppDialog } from "@/components/app/app-dialog";
import { Badge } from "@/components/app/badge";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import {
  DataTable,
  EmptyState,
  TableBody,
  TableHead,
  Td,
  Th,
  Tr,
} from "@/components/app/data-table";
import { Field, fieldAria } from "@/components/app/field";
import { Notice, type NoticeState } from "@/components/app/notice";
import {
  MutedText,
  PageHeader,
  PageTitle,
  Panel,
  PanelTitle,
} from "@/components/app/panel";
import { Segmented } from "@/components/app/segmented";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, errorMessage } from "@/lib/client-api";
import { formatDate, todayIso } from "@/lib/dates";
import type { SalesMemberItem } from "@/types/sales-members";

type Filter = "all" | "active" | "inactive";
type MemberForm = { id: string | null; name: string; phone: string };
type FormErrors = Partial<Record<"name" | "phone", string>>;

function MemberFormFields({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: MemberForm;
  onSubmit: (form: MemberForm) => Promise<void>;
  onCancel: () => void;
}) {
  const id = useId();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<FormErrors>({});
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const name = form.name.trim();
    const phone = form.phone.trim();
    const nextErrors: FormErrors = {};
    if (!name) nextErrors.name = "Isi nama anggota.";
    if (phone && phone.replace(/\D/g, "").length < 8)
      nextErrors.phone = "Isi nomor telepon atau WhatsApp, minimal 8 angka.";
    setErrors(nextErrors);
    const firstInvalid = (["name", "phone"] as const).find(
      (field) => nextErrors[field],
    );
    if (firstInvalid) {
      document.getElementById(`${id}-${firstInvalid}`)?.focus();
      return;
    }

    setPending(true);
    setFailure("");
    try {
      await onSubmit({ ...form, name, phone });
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
      <Field id={`${id}-name`} label="Nama anggota" error={errors.name}>
        <Input
          id={`${id}-name`}
          name="name"
          autoComplete="off"
          maxLength={120}
          value={form.name}
          onChange={(event) =>
            setForm((current) => ({ ...current, name: event.target.value }))
          }
          {...fieldAria(`${id}-name`, undefined, errors.name)}
        />
      </Field>
      <Field
        id={`${id}-phone`}
        label="Telepon atau WhatsApp"
        hint="Opsional. Contoh format: 0812-5550-0018"
        error={errors.phone}
      >
        <Input
          id={`${id}-phone`}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          maxLength={40}
          className="font-mono"
          value={form.phone}
          onChange={(event) =>
            setForm((current) => ({ ...current, phone: event.target.value }))
          }
          {...fieldAria(`${id}-phone`, true, errors.phone)}
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
          {pending
            ? "Menyimpan…"
            : initial.id
              ? "Simpan perubahan"
              : "Tambah anggota"}
        </Button>
      </div>
    </form>
  );
}

// Halaman Tim Sales: daftar anggota beserta status aktifnya, tambah anggota,
// ubah data, nonaktifkan anggota yang keluar, dan aktifkan kembali.
export function TeamView({
  initialMembers,
}: {
  initialMembers: SalesMemberItem[];
}) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [filter, setFilter] = useState<Filter>("all");
  const [form, setForm] = useState<MemberForm | null>(null);
  const [deactivating, setDeactivating] = useState<SalesMemberItem | null>(
    null,
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);

  const activeCount = members.filter((member) => member.isActive).length;
  const inactiveCount = members.length - activeCount;
  const visible = members.filter((member) =>
    filter === "active"
      ? member.isActive
      : filter === "inactive"
        ? !member.isActive
        : true,
  );

  function replace(member: SalesMemberItem) {
    setMembers((list) =>
      list.map((item) => (item.id === member.id ? member : item)),
    );
    // Halaman lain (form transaksi, leads) membaca daftar anggota dari server.
    router.refresh();
  }

  async function saveMember(input: MemberForm) {
    if (input.id) {
      const updated = await apiFetch<SalesMemberItem>(
        `/api/sales-members/${input.id}`,
        { method: "PATCH", body: { name: input.name, phone: input.phone } },
      );
      replace(updated);
      setNotice({
        tone: "success",
        message: `Data ${updated.name} diperbarui.`,
      });
    } else {
      const created = await apiFetch<SalesMemberItem>("/api/sales-members", {
        method: "POST",
        body: { name: input.name, phone: input.phone },
      });
      setMembers((list) => [...list, created]);
      router.refresh();
      setNotice({
        tone: "success",
        message: `${created.name} ditambahkan ke tim dan bisa dipilih pada transaksi baru.`,
      });
    }
    setForm(null);
  }

  async function setActive(member: SalesMemberItem, isActive: boolean) {
    const updated = await apiFetch<SalesMemberItem>(
      `/api/sales-members/${member.id}`,
      { method: "PATCH", body: { isActive } },
    );
    replace(updated);
    setNotice({
      tone: "success",
      message: isActive
        ? `${updated.name} diaktifkan kembali.`
        : `${updated.name} dinonaktifkan. Riwayat penjualan dan leads-nya tetap tersimpan.`,
    });
  }

  async function reactivate(member: SalesMemberItem) {
    setBusyId(member.id);
    try {
      await setActive(member, true);
    } catch (error) {
      setNotice({ tone: "error", message: errorMessage(error) });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="@container/page grid max-w-[1440px] gap-6">
      <div className="grid gap-4">
        <PageHeader>
          <div className="grid gap-1">
            <PageTitle>Tim Sales</PageTitle>
            <MutedText>
              {activeCount} anggota aktif · {inactiveCount} nonaktif
            </MutedText>
          </div>
          <Button
            size="lg"
            onClick={() => setForm({ id: null, name: "", phone: "" })}
          >
            <Plus aria-hidden="true" />
            Tambah anggota
          </Button>
        </PageHeader>
        <Notice notice={notice} onDismiss={() => setNotice(null)} />
      </div>

      <Panel aria-labelledby="team-list-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid gap-1">
            <PanelTitle id="team-list-title">Anggota tim</PanelTitle>
            <MutedText>
              Anggota nonaktif tidak bisa dipilih pada transaksi atau lead baru.
            </MutedText>
          </div>
          <Segmented
            label="Saring status anggota"
            value={filter}
            options={[
              { value: "all", label: `Semua (${members.length})` },
              { value: "active", label: `Aktif (${activeCount})` },
              { value: "inactive", label: `Nonaktif (${inactiveCount})` },
            ]}
            onChange={setFilter}
          />
        </div>

        {visible.length > 0 ? (
          <DataTable>
            <TableHead>
              <Th>Nama</Th>
              <Th>Telepon / WhatsApp</Th>
              <Th>Bergabung</Th>
              <Th>Status</Th>
              <Th end>Aksi</Th>
            </TableHead>
            <TableBody>
              {visible.map((member) => (
                <Tr key={member.id}>
                  <Td label="Nama" full className="font-medium">
                    {member.name}
                  </Td>
                  <Td label="Telepon / WhatsApp" mono nowrap>
                    {member.phone || "—"}
                  </Td>
                  <Td label="Bergabung" muted nowrap>
                    {formatDate(todayIso(new Date(member.createdAt)))}
                  </Td>
                  <Td label="Status">
                    {member.isActive ? (
                      <Badge>
                        <CircleCheck aria-hidden="true" />
                        Aktif
                      </Badge>
                    ) : (
                      <Badge className="text-muted-foreground">
                        <CircleSlash aria-hidden="true" />
                        Nonaktif
                      </Badge>
                    )}
                  </Td>
                  <Td label="Aksi" end full>
                    <span className="inline-flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={`Ubah ${member.name}`}
                        onClick={() =>
                          setForm({
                            id: member.id,
                            name: member.name,
                            phone: member.phone,
                          })
                        }
                      >
                        Ubah
                      </Button>
                      {member.isActive ? (
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label={`Nonaktifkan ${member.name}`}
                          onClick={() => setDeactivating(member)}
                        >
                          Nonaktifkan
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label={`Aktifkan kembali ${member.name}`}
                          disabled={busyId === member.id}
                          onClick={() => reactivate(member)}
                        >
                          Aktifkan kembali
                        </Button>
                      )}
                    </span>
                  </Td>
                </Tr>
              ))}
            </TableBody>
          </DataTable>
        ) : members.length === 0 ? (
          <EmptyState title="Belum ada anggota tim sales.">
            Tekan Tambah anggota untuk mendaftarkan sales pertama. Setelah itu
            kamu bisa mencatat penjualan dan leads atas namanya.
          </EmptyState>
        ) : (
          <EmptyState
            title={
              filter === "inactive"
                ? "Tidak ada anggota nonaktif."
                : "Tidak ada anggota aktif."
            }
          />
        )}
      </Panel>

      <AppDialog
        open={Boolean(form)}
        onOpenChange={(open) => {
          if (!open) setForm(null);
        }}
        title={form?.id ? "Ubah data anggota" : "Tambah anggota"}
        description={
          form?.id
            ? "Perbarui nama atau nomor yang bisa dihubungi."
            : "Anggota baru langsung aktif dan bisa dipilih pada transaksi dan lead."
        }
      >
        {form && (
          <MemberFormFields
            key={form.id ?? "baru"}
            initial={form}
            onSubmit={saveMember}
            onCancel={() => setForm(null)}
          />
        )}
      </AppDialog>

      <ConfirmDialog
        open={Boolean(deactivating)}
        onOpenChange={(open) => {
          if (!open) setDeactivating(null);
        }}
        title={`Nonaktifkan ${deactivating?.name ?? "anggota"}?`}
        description="Anggota ini tidak bisa dipilih lagi pada transaksi dan lead baru. Riwayat penjualan dan leads-nya tetap tersimpan, dan kamu bisa mengaktifkannya kembali kapan saja."
        confirmLabel="Nonaktifkan"
        pendingLabel="Menonaktifkan…"
        onConfirm={async () => {
          if (!deactivating) return;
          await setActive(deactivating, false);
          setDeactivating(null);
        }}
      />
    </div>
  );
}
