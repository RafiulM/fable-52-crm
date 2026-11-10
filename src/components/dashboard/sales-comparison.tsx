"use client";

import { useState } from "react";
import { ListFilter } from "lucide-react";
import { Badge } from "@/components/app/badge";
import { MutedText, Panel, PanelTitle } from "@/components/app/panel";
import { Segmented } from "@/components/app/segmented";
import { persen, ratio, rupiah } from "@/lib/format";
import type { DashboardData, DashboardPeriod } from "@/types/dashboard";

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: "today", label: "Hari ini" },
  { value: "week", label: "Minggu ini" },
  { value: "month", label: "Bulan ini" },
];

// Bagan batang mendatar: omzet tiap sales untuk periode terpilih, urut dari
// yang terbesar. Memilih satu baris menyaring daftar transaksi hari ini.
export function SalesComparison({
  comparison,
  selectedSalesId,
  onSelectSales,
}: {
  comparison: DashboardData["comparison"];
  selectedSalesId: string | null;
  onSelectSales: (salesId: string | null) => void;
}) {
  const [period, setPeriod] = useState<DashboardPeriod>("today");

  const stats = comparison[period];
  const total = stats.reduce((sum, row) => sum + row.amount, 0);
  const top = Math.max(0, ...stats.map((row) => row.amount));
  const rows = [...stats].sort((a, b) => b.amount - a.amount);

  return (
    <Panel aria-labelledby="dashboard-comparison-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <PanelTitle id="dashboard-comparison-title">
            Perbandingan sales
          </PanelTitle>
          <MutedText>Pilih nama untuk melihat transaksinya hari ini.</MutedText>
        </div>
        <Segmented
          label="Periode perbandingan"
          value={period}
          options={PERIODS}
          onChange={setPeriod}
        />
      </div>

      {rows.length === 0 ? (
        <MutedText className="border-t pt-6 pb-2 text-[15px]">
          Belum ada anggota tim sales. Tambahkan anggota untuk mulai
          membandingkan.
        </MutedText>
      ) : (
        <ol className="grid gap-1">
          {rows.map((row, index) => (
            <li key={row.salesId}>
              <button
                type="button"
                aria-pressed={selectedSalesId === row.salesId}
                onClick={() =>
                  onSelectSales(
                    selectedSalesId === row.salesId ? null : row.salesId,
                  )
                }
                className="group relative grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 overflow-hidden rounded-sm py-3 pr-3 pl-4 text-left outline-none [grid-template-areas:'name_value'_'meta_meta'_'bar_bar'] hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:bg-primary-quiet aria-pressed:before:absolute aria-pressed:before:inset-y-0 aria-pressed:before:left-0 aria-pressed:before:w-1 aria-pressed:before:bg-primary @min-[561px]/panel:grid-cols-[272px_minmax(0,1fr)_136px] @min-[561px]/panel:gap-y-1 @min-[561px]/panel:[grid-template-areas:'name_bar_value'_'meta_bar_value']"
              >
                <span className="flex min-w-0 flex-wrap items-center gap-2 [grid-area:name]">
                  <span className="font-medium">{row.name}</span>
                  {index === 0 && row.amount > 0 && <Badge>Teratas</Badge>}
                  <ListFilter
                    className="hidden size-4 group-aria-pressed:inline-block"
                    aria-hidden="true"
                  />
                </span>
                <span className="min-w-0 text-[13px] leading-[1.38] text-muted-foreground [grid-area:meta]">
                  {row.count} transaksi · {row.leads} leads ·{" "}
                  {persen(ratio(row.won, row.leads))} konversi
                </span>
                <span
                  aria-hidden="true"
                  className="h-2.5 overflow-hidden rounded-sm bg-border [grid-area:bar]"
                >
                  <span
                    className="block h-full rounded-sm bg-foreground transition-[width] duration-200 motion-reduce:transition-none"
                    style={{ width: `${ratio(row.amount, top)}%` }}
                  />
                </span>
                <span className="grid justify-items-end gap-1 font-mono whitespace-nowrap [grid-area:value]">
                  <span>{rupiah(row.amount)}</span>
                  <span className="text-[13px] leading-[1.38] text-muted-foreground">
                    {persen(ratio(row.amount, total))} dari total
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
