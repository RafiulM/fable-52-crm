"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { apiFetch } from "@/lib/client-api";
import { formatLongDate } from "@/lib/dates";
import { rupiah } from "@/lib/format";
import type { DashboardData } from "@/types/dashboard";

// Susunan halaman utama: ringkasan di atas, tren harian, lalu dua kolom
// (perbandingan sales dan tren mingguan), dan transaksi hari ini di bawah.
// Semua angka datang dari server; halaman memuat ulang sendiri setelah ada
// pencatatan baru, saat tab kembali aktif, dan tiap satu menit.
export function DashboardView({ data }: { data: DashboardData }) {
  const router = useRouter();
  // Sales yang dipilih di bagan perbandingan menyaring daftar transaksi.
  const [selectedSalesId, setSelectedSalesId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);
  // Transaksi yang dicatat di sesi ini, untuk tanda "Baru" di daftar.
  const [newIds, setNewIds] = useState<string[]>([]);

  useAutoRefresh();

  const selectedSales =
    data.comparison.today
      .map((row) => ({ id: row.salesId, name: row.name }))
      .find((member) => member.id === selectedSalesId) ?? null;

  async function recordSale(input: RecordSaleInput) {
    const created = await apiFetch<{ id: string; salesName: string }>(
      "/api/transactions",
      {
        method: "POST",
        body: {
          salesMemberId: input.salesId,
          amount: input.amount,
          productDescription: input.product,
          transactionDate: data.today,
        },
      },
    );
    setNewIds((ids) => [created.id, ...ids]);
    setDialogOpen(false);
    setNotice({
      tone: "success",
      message: `Transaksi ${rupiah(input.amount)} untuk ${created.salesName} tersimpan. Angka dashboard sudah diperbarui.`,
    });
    // Ambil ulang semua hitungan dari server.
    router.refresh();
  }

  return (
    <div className="@container/page grid max-w-[1440px] gap-6">
      <div className="grid gap-4">
        <PageHeader>
          <div className="grid gap-1">
            <PageTitle>Dashboard</PageTitle>
            <MutedText>{formatLongDate(data.today)}</MutedText>
          </div>
          <Button size="lg" onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden="true" />
            Catat penjualan
          </Button>
        </PageHeader>
        <Notice notice={notice} onDismiss={() => setNotice(null)} />
      </div>

      <SummaryBand summary={data.summary} />

      <DailyTrend daily={data.daily} today={data.today} />

      <div className="grid gap-6 @min-[1000px]/page:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <SalesComparison
          comparison={data.comparison}
          selectedSalesId={selectedSalesId}
          onSelectSales={setSelectedSalesId}
        />
        <WeekTrend week={data.week} today={data.today} />
      </div>

      <TodayTransactions
        transactions={data.transactions}
        newIds={newIds}
        selectedSales={selectedSales}
        onClearFilter={() => setSelectedSalesId(null)}
      />

      <RecordSaleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        salesMembers={data.salesMembers}
        today={data.today}
        onSubmit={recordSale}
      />
    </div>
  );
}
