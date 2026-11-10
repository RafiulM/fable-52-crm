"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Notice, type NoticeState } from "@/components/app/notice";
import { MutedText, PageHeader, PageTitle } from "@/components/app/panel";
import { DailyTrend } from "@/components/dashboard/daily-trend";
import {
  RecordSaleDialog,
  type RecordSaleInput,
} from "@/components/dashboard/record-sale-dialog";
import { SalesComparison } from "@/components/dashboard/sales-comparison";
import { SummaryBand } from "@/components/dashboard/summary-band";
import { TodayTransactions } from "@/components/dashboard/today-transactions";
import { WeekTrend } from "@/components/dashboard/week-trend";
import { Button } from "@/components/ui/button";
import { withNewTransactions } from "@/lib/dashboard";
import { formatLongDate } from "@/lib/dates";
import { rupiah } from "@/lib/format";
import type { DashboardData, DashboardTransaction } from "@/types/dashboard";

// Susunan halaman utama: ringkasan di atas, tren harian, lalu dua kolom
// (perbandingan sales dan tren mingguan), dan transaksi hari ini di bawah.
export function DashboardView({ data }: { data: DashboardData }) {
  // Sales yang dipilih di bagan perbandingan menyaring daftar transaksi.
  const [selectedSalesId, setSelectedSalesId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);
  // Transaksi yang baru dicatat di sesi ini. Semua angka di halaman dihitung
  // ulang darinya, jadi dashboard langsung ikut berubah.
  const [added, setAdded] = useState<DashboardTransaction[]>([]);
  const sequence = useRef(0);

  const view = withNewTransactions(data, added);
  const selectedSales =
    data.salesMembers.find((member) => member.id === selectedSalesId) ?? null;

  async function recordSale(input: RecordSaleInput) {
    const member = data.salesMembers.find((item) => item.id === input.salesId);
    if (!member) throw new Error("Sales tidak ditemukan. Muat ulang halaman.");
    sequence.current += 1;
    setAdded((list) => [
      {
        id: `baru-${sequence.current}`,
        createdAt: new Date().toISOString(),
        salesId: member.id,
        salesName: member.name,
        product: input.product,
        amount: input.amount,
        isNew: true,
      },
      ...list,
    ]);
    setDialogOpen(false);
    setNotice({
      tone: "success",
      message: `Transaksi ${rupiah(input.amount)} untuk ${member.name} tersimpan. Angka dashboard sudah diperbarui.`,
    });
  }

  return (
    <div className="@container/page grid max-w-[1440px] gap-6">
      <div className="grid gap-4">
        <PageHeader>
          <div className="grid gap-1">
            <PageTitle>Dashboard</PageTitle>
            <MutedText>{formatLongDate(view.today)}</MutedText>
          </div>
          <Button size="lg" onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden="true" />
            Catat penjualan
          </Button>
        </PageHeader>
        <Notice notice={notice} onDismiss={() => setNotice(null)} />
      </div>

      <SummaryBand summary={view.summary} />

      <DailyTrend daily={view.daily} today={view.today} />

      <div className="grid gap-6 @min-[1000px]/page:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <SalesComparison
          comparison={view.comparison}
          selectedSalesId={selectedSalesId}
          onSelectSales={setSelectedSalesId}
        />
        <WeekTrend week={view.week} today={view.today} />
      </div>

      <TodayTransactions
        transactions={view.transactions}
        selectedSales={selectedSales}
        onClearFilter={() => setSelectedSalesId(null)}
      />

      <RecordSaleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        salesMembers={view.salesMembers}
        today={view.today}
        onSubmit={recordSale}
      />
    </div>
  );
}
