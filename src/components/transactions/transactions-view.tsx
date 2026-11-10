"use client";

import { useRef, useState } from "react";
import {
  DataTable,
  EmptyRow,
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
import { formatDate, formatTime } from "@/lib/dates";
import { rupiah } from "@/lib/format";
import type { SalesMemberOption } from "@/types/dashboard";
import type { TransactionInput, TransactionItem } from "@/types/transactions";

// Terbaru dulu: tanggal transaksi, lalu waktu pencatatan.
function sortTransactions(list: TransactionItem[]) {
  return [...list].sort(
    (a, b) =>
      b.transactionDate.localeCompare(a.transactionDate) ||
      b.createdAt.localeCompare(a.createdAt),
  );
}

// Halaman Catat Penjualan: form transaksi baru di kiri, riwayat di kanan.
export function TransactionsView({
  initialTransactions,
  salesMembers,
  today,
}: {
  initialTransactions: TransactionItem[];
  salesMembers: SalesMemberOption[];
  today: string;
}) {
  const [transactions, setTransactions] = useState(() =>
    sortTransactions(initialTransactions),
  );
  const [notice, setNotice] = useState<NoticeState>(null);
  const [filterSales, setFilterSales] = useState("");
  const [query, setQuery] = useState("");
  const sequence = useRef(0);

  // Pilihan filter memuat semua sales yang muncul di riwayat, termasuk yang
  // sudah nonaktif, supaya transaksi lamanya tetap bisa dicari.
  const filterOptions = [
    ...new Map(
      [
        ...salesMembers.map((member) => [member.id, member.name] as const),
        ...transactions.map(
          (item) => [item.salesMemberId, item.salesName] as const,
        ),
      ].sort((a, b) => a[1].localeCompare(b[1])),
    ),
  ];
  const needle = query.trim().toLowerCase();
  const visible = transactions.filter(
    (item) =>
      (!filterSales || item.salesMemberId === filterSales) &&
      (!needle || item.productDescription.toLowerCase().includes(needle)),
  );
  const filtered = Boolean(filterSales || needle);
  const total = visible.reduce((sum, item) => sum + item.amount, 0);

  function salesName(id: string) {
    return salesMembers.find((member) => member.id === id)?.name ?? "Sales";
  }

  async function createTransaction(input: TransactionInput) {
    sequence.current += 1;
    const created: TransactionItem = {
      id: `baru-${sequence.current}`,
      ...input,
      salesName: salesName(input.salesMemberId),
      createdAt: new Date().toISOString(),
    };
    setTransactions((list) => sortTransactions([created, ...list]));
    setNotice({
      tone: "success",
      message: `Transaksi ${rupiah(input.amount)} untuk ${created.salesName} tersimpan.`,
    });
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

        <Panel aria-labelledby="transaction-history-title">
          <div className="grid gap-1">
            <PanelTitle id="transaction-history-title">
              Riwayat transaksi
            </PanelTitle>
            <MutedText>
              {visible.length} transaksi · {rupiah(total)}
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
                {filterOptions.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
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

          {visible.length > 0 ? (
            <DataTable>
              <TableHead>
                <Th>Tanggal</Th>
                <Th>Sales</Th>
                <Th>Produk</Th>
                <Th end>Nominal</Th>
              </TableHead>
              <TableBody>
                {visible.map((item) => (
                  <Tr key={item.id}>
                    <Td label="Tanggal" full mono muted nowrap>
                      {formatDate(item.transactionDate)} ·{" "}
                      {formatTime(item.createdAt)}
                    </Td>
                    <Td label="Sales" nowrap className="font-medium">
                      {item.salesName}
                    </Td>
                    <Td label="Produk" muted>
                      {item.productDescription || "Tanpa keterangan"}
                    </Td>
                    <Td label="Nominal" end mono nowrap>
                      {rupiah(item.amount)}
                    </Td>
                  </Tr>
                ))}
              </TableBody>
            </DataTable>
          ) : (
            <EmptyRow>
              {filtered
                ? "Tidak ada transaksi yang cocok dengan filter."
                : "Belum ada transaksi yang dicatat."}
            </EmptyRow>
          )}
        </Panel>
      </div>
    </div>
  );
}
