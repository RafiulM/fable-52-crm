"use client";

import { useState } from "react";
import {
  MutedText,
  PageHeader,
  PageTitle,
  Panel,
  PanelTitle,
} from "@/components/app/panel";
import { SalesComparison } from "@/components/dashboard/sales-comparison";
import { SummaryBand } from "@/components/dashboard/summary-band";
import { TodayTransactions } from "@/components/dashboard/today-transactions";
import { formatLongDate } from "@/lib/dates";
import type { DashboardData } from "@/types/dashboard";

// Susunan halaman utama: ringkasan di atas, tren harian, lalu dua kolom
// (perbandingan sales dan tren mingguan), dan transaksi hari ini di bawah.
export function DashboardView({ data }: { data: DashboardData }) {
  // Sales yang dipilih di bagan perbandingan menyaring daftar transaksi.
  const [selectedSalesId, setSelectedSalesId] = useState<string | null>(null);
  const selectedSales =
    data.comparison.today
      .map((row) => ({ id: row.salesId, name: row.name }))
      .find((member) => member.id === selectedSalesId) ?? null;

  return (
    <div className="@container/page grid max-w-[1440px] gap-6">
      <PageHeader>
        <div className="grid gap-1">
          <PageTitle>Dashboard</PageTitle>
          <MutedText>{formatLongDate(data.today)}</MutedText>
        </div>
      </PageHeader>

      <SummaryBand summary={data.summary} />

      <Panel aria-labelledby="dashboard-daily-title">
        <PanelTitle id="dashboard-daily-title">Tren penjualan harian</PanelTitle>
        <MutedText>{data.daily.length} hari terakhir</MutedText>
      </Panel>

      <div className="grid gap-6 @min-[1000px]/page:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <SalesComparison
          comparison={data.comparison}
          selectedSalesId={selectedSalesId}
          onSelectSales={setSelectedSalesId}
        />
        <Panel aria-labelledby="dashboard-week-title">
          <PanelTitle id="dashboard-week-title">
            Minggu ini vs minggu lalu
          </PanelTitle>
          <MutedText>Senin sampai Minggu</MutedText>
        </Panel>
      </div>

      <TodayTransactions
        transactions={data.transactions}
        selectedSales={selectedSales}
        onClearFilter={() => setSelectedSalesId(null)}
      />
    </div>
  );
}
