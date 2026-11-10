"use client";

import { useState } from "react";
import {
  DataTable,
  EmptyRow,
  TableBody,
  TableHead,
  Td,
  Th,
  Tr,
} from "@/components/app/data-table";
import { Notice, type NoticeState } from "@/components/app/notice";
import {
  MutedText,
  PageHeader,
  PageTitle,
  Panel,
  PanelTitle,
} from "@/components/app/panel";
import { formatDate, formatTime } from "@/lib/dates";
import { rupiah } from "@/lib/format";
import type { SalesMemberOption } from "@/types/dashboard";
import type { TransactionItem } from "@/types/transactions";

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
  const [transactions] = useState(initialTransactions);
  const [notice, setNotice] = useState<NoticeState>(null);
  const total = transactions.reduce((sum, item) => sum + item.amount, 0);

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
          <MutedText>
            {salesMembers.length} sales aktif · tanggal hari ini {formatDate(today)}
          </MutedText>
        </Panel>

        <Panel aria-labelledby="transaction-history-title">
          <div className="grid gap-1">
            <PanelTitle id="transaction-history-title">
              Riwayat transaksi
            </PanelTitle>
            <MutedText>
              {transactions.length} transaksi · {rupiah(total)}
            </MutedText>
          </div>

          {transactions.length > 0 ? (
            <DataTable>
              <TableHead>
                <Th>Tanggal</Th>
                <Th>Sales</Th>
                <Th>Produk</Th>
                <Th end>Nominal</Th>
              </TableHead>
              <TableBody>
                {transactions.map((item) => (
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
            <EmptyRow>Belum ada transaksi yang dicatat.</EmptyRow>
          )}
        </Panel>
      </div>
    </div>
  );
}
