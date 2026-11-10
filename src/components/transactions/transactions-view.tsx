"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
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
import { Field, NativeSelect } from "@/components/app/field";
import { Notice, type NoticeState } from "@/components/app/notice";
import {
  MutedText,
  PageHeader,
  PageTitle,
  Panel,
  PanelTitle,
} from "@/components/app/panel";
import { TransactionFormCard } from "@/components/transactions/transaction-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, apiFetchList, errorMessage } from "@/lib/client-api";
import { formatDate, formatRelativeDate, formatTime } from "@/lib/dates";
import { formatDigits, rupiah } from "@/lib/format";
import type { SalesMemberOption } from "@/types/dashboard";
import type {
  TransactionInput,
  TransactionItem,
  TransactionListMeta,
} from "@/types/transactions";

const PAGE_SIZE = 50;

// Halaman Catat Penjualan: form transaksi baru di kiri, riwayat di kanan.
// Riwayat dimuat dari /api/transactions; filter dan "muat lebih banyak"
// dikerjakan server, jadi jumlah dan total selalu atas semua data yang cocok.
export function TransactionsView({
  initialTransactions,
  initialMeta,
  salesMembers,
  filterMembers,
  today,
}: {
  initialTransactions: TransactionItem[];
  initialMeta: TransactionListMeta;
  // Sales aktif, untuk mencatat transaksi baru.
  salesMembers: SalesMemberOption[];
  // Semua sales termasuk yang nonaktif, untuk menyaring riwayat.
  filterMembers: SalesMemberOption[];
  today: string;
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [meta, setMeta] = useState(initialMeta);
  const [loading, setLoading] = useState(false);
  const [loadFailure, setLoadFailure] = useState("");
  const [notice, setNotice] = useState<NoticeState>(null);
  const [editing, setEditing] = useState<TransactionItem | null>(null);
  const [deleting, setDeleting] = useState<TransactionItem | null>(null);
  const [filterSales, setFilterSales] = useState("");
  const [query, setQuery] = useState("");
  // Transaksi yang dicatat di sesi ini, untuk tanda "Baru".
  const [newIds, setNewIds] = useState<string[]>([]);
  // Setelah baris dihapus tombolnya ikut hilang, jadi fokus pindah ke judul riwayat.
  const historyTitleRef = useRef<HTMLHeadingElement>(null);
  // Hanya jawaban permintaan terakhir yang dipakai; yang lebih lama diabaikan.
  const requestId = useRef(0);
  const firstRender = useRef(true);

  const needle = query.trim();
  const filtered = Boolean(filterSales || needle);

  async function load(offset: number, sales = filterSales, search = needle) {
    const id = (requestId.current += 1);
    setLoading(true);
    setLoadFailure("");
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });
      if (sales) params.set("salesMemberId", sales);
      if (search) params.set("q", search);
      const result = await apiFetchList<TransactionItem, TransactionListMeta>(
        `/api/transactions?${params}`,
      );
      if (id !== requestId.current) return;
      setTransactions((current) =>
        offset === 0 ? result.data : [...current, ...result.data],
      );
      setMeta(result.meta);
    } catch (error) {
      if (id === requestId.current) setLoadFailure(errorMessage(error));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  // Muat ulang saat filter berubah. Ketikan pencarian ditunggu sebentar supaya
  // tidak meminta data di setiap huruf.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      void load(0, filterSales, needle);
    }, 300);
    return () => window.clearTimeout(timer);
    // `load` sengaja tidak jadi dependensi: ia membaca filter lewat argumen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSales, needle]);

  async function createTransaction(input: TransactionInput) {
    const created = await apiFetch<TransactionItem>("/api/transactions", {
      method: "POST",
      body: input,
    });
    setNewIds((ids) => [created.id, ...ids]);
    setNotice({
      tone: "success",
      message: `Transaksi ${rupiah(created.amount)} untuk ${created.salesName} tersimpan.`,
    });
    await load(0);
  }

  async function updateTransaction(id: string, input: TransactionInput) {
    const updated = await apiFetch<TransactionItem>(`/api/transactions/${id}`, {
      method: "PATCH",
      body: input,
    });
    setEditing(null);
    setNotice({
      tone: "success",
      message: `Transaksi ${updated.salesName} diperbarui menjadi ${rupiah(updated.amount)}.`,
    });
    await load(0);
  }

  async function deleteTransaction(target: TransactionItem) {
    await apiFetch(`/api/transactions/${target.id}`, { method: "DELETE" });
    setDeleting(null);
    setNotice({
      tone: "success",
      message: `Transaksi ${rupiah(target.amount)} milik ${target.salesName} dihapus.`,
    });
    await load(0);
  }

  // Saat mengubah, sales pemilik transaksi tetap bisa dipilih walau sudah
  // nonaktif (tidak ada di daftar sales aktif).
  function membersFor(item: TransactionItem) {
    return salesMembers.some((member) => member.id === item.salesMemberId)
      ? salesMembers
      : [...salesMembers, { id: item.salesMemberId, name: item.salesName }];
  }

  return (
    <div className="@container/page grid max-w-[1440px] gap-6">
      <div className="grid gap-4">
        <PageHeader>
          <div className="grid gap-1">
            <PageTitle>Catat Penjualan</PageTitle>
            <MutedText>
              Catat transaksi tiap sales, lalu perbaiki atau hapus kalau ada
              salah input.
            </MutedText>
          </div>
        </PageHeader>
        <Notice notice={notice} onDismiss={() => setNotice(null)} />
      </div>

      <div className="grid items-start gap-6 @min-[900px]/page:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <Panel aria-labelledby="transaction-form-title">
          <PanelTitle id="transaction-form-title">Transaksi baru</PanelTitle>
          {salesMembers.length > 0 ? (
            <TransactionFormCard
              salesMembers={salesMembers}
              today={today}
              submitLabel="Simpan transaksi"
              resetAfterSubmit
              onSubmit={createTransaction}
            />
          ) : (
            <MutedText className="text-[15px]">
              Belum ada anggota tim sales yang aktif. Tambahkan anggota dulu
              sebelum mencatat penjualan.
            </MutedText>
          )}
        </Panel>

        <Panel aria-labelledby="transaction-history-title" aria-busy={loading}>
          <div className="grid gap-1">
            <PanelTitle
              id="transaction-history-title"
              ref={historyTitleRef}
              tabIndex={-1}
              className="outline-none"
            >
              Riwayat transaksi
            </PanelTitle>
            <MutedText>
              {meta.total.toLocaleString("id-ID")} transaksi ·{" "}
              {rupiah(meta.totalAmount)}
              {filtered && " · sesuai filter"}
            </MutedText>
          </div>

          <div className="grid items-end gap-3 @min-[561px]/panel:grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto]">
            <Field id="transaction-filter-sales" label="Sales">
              <NativeSelect
                id="transaction-filter-sales"
                value={filterSales}
                onChange={(event) => setFilterSales(event.target.value)}
              >
                <option value="">Semua sales</option>
                {filterMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field
              id="transaction-filter-query"
              label="Cari produk atau keterangan"
            >
              <Input
                id="transaction-filter-query"
                type="search"
                autoComplete="off"
                maxLength={100}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </Field>
            <Button
              variant="outline"
              disabled={!filtered}
              onClick={() => {
                setFilterSales("");
                setQuery("");
              }}
            >
              Hapus filter
            </Button>
          </div>

          {loadFailure && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/30 px-4 py-3"
            >
              <p className="text-destructive">{loadFailure}</p>
              <Button variant="outline" size="sm" onClick={() => load(0)}>
                Coba lagi
              </Button>
            </div>
          )}

          {transactions.length > 0 ? (
            <DataTable>
              <TableHead>
                <Th>Tanggal</Th>
                <Th>Sales</Th>
                <Th>Produk</Th>
                <Th end>Nominal</Th>
                <Th end>Aksi</Th>
              </TableHead>
              <TableBody>
                {transactions.map((item) => (
                  <Tr key={item.id}>
                    <Td label="Tanggal" full mono muted nowrap>
                      {formatRelativeDate(item.transactionDate, today)} ·{" "}
                      {formatTime(item.createdAt)}
                    </Td>
                    <Td label="Sales" nowrap>
                      <span className="inline-flex flex-wrap items-center gap-2 font-medium">
                        {item.salesName}
                        {newIds.includes(item.id) && <Badge>Baru</Badge>}
                      </span>
                    </Td>
                    <Td label="Produk" muted>
                      {item.productDescription || "Tanpa keterangan"}
                    </Td>
                    <Td label="Nominal" end mono nowrap>
                      {rupiah(item.amount)}
                    </Td>
                    <Td label="Aksi" end nowrap>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Ubah transaksi ${item.salesName} ${rupiah(item.amount)}`}
                        onClick={() => setEditing(item)}
                      >
                        <Pencil aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Hapus transaksi ${item.salesName} ${rupiah(item.amount)}`}
                        onClick={() => setDeleting(item)}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </TableBody>
            </DataTable>
          ) : loading ? (
            <MutedText className="border-t pt-6 pb-2 text-[15px]">
              Memuat transaksi…
            </MutedText>
          ) : filtered ? (
            <EmptyState title="Tidak ada transaksi yang cocok dengan filter.">
              Ubah pilihan sales atau kata pencarian, atau hapus filter untuk
              melihat semua transaksi.
            </EmptyState>
          ) : (
            <EmptyState title="Belum ada transaksi yang dicatat.">
              Isi form Transaksi baru untuk mencatat penjualan pertama. Angka di
              dashboard akan ikut terisi.
            </EmptyState>
          )}

          {transactions.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <MutedText>
                Menampilkan {transactions.length.toLocaleString("id-ID")} dari{" "}
                {meta.total.toLocaleString("id-ID")} transaksi
              </MutedText>
              {meta.hasMore && (
                <Button
                  variant="outline"
                  disabled={loading}
                  onClick={() => load(transactions.length)}
                >
                  {loading ? "Memuat…" : "Muat lebih banyak"}
                </Button>
              )}
            </div>
          )}
        </Panel>
      </div>

      <AppDialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title="Ubah transaksi"
        description="Perbaiki sales, tanggal, nominal, atau keterangan yang salah input."
      >
        {editing && (
          <TransactionFormCard
            key={editing.id}
            salesMembers={membersFor(editing)}
            today={today}
            initial={{
              salesId: editing.salesMemberId,
              date: editing.transactionDate,
              amount: formatDigits(String(editing.amount)),
              product: editing.productDescription,
            }}
            submitLabel="Simpan perubahan"
            onSubmit={(input) => updateTransaction(editing.id, input)}
            onCancel={() => setEditing(null)}
          />
        )}
      </AppDialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Hapus transaksi ini?"
        description="Transaksi yang dihapus tidak bisa dikembalikan, dan angka dashboard ikut berubah."
        confirmLabel="Hapus transaksi"
        pendingLabel="Menghapus…"
        fallbackFocus={historyTitleRef}
        onConfirm={async () => {
          if (deleting) await deleteTransaction(deleting);
        }}
      >
        {deleting && (
          <p className="rounded-md bg-muted px-4 py-3">
            {deleting.salesName} ·{" "}
            {deleting.productDescription || "Tanpa keterangan"} ·{" "}
            <span className="font-mono">{rupiah(deleting.amount)}</span> ·{" "}
            {formatDate(deleting.transactionDate)}
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}
