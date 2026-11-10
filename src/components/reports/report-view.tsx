"use client";

import { useRef, useState } from "react";
import { Bar } from "@/components/app/bar";
import {
  DataTable,
  EmptyState,
  TableBody,
  TableHead,
  Td,
  Th,
  Tr,
} from "@/components/app/data-table";
import { Delta } from "@/components/app/delta";
import { Field, fieldAria, NativeSelect } from "@/components/app/field";
import {
  MutedText,
  PageHeader,
  PageTitle,
  Panel,
  PanelTitle,
} from "@/components/app/panel";
import { Segmented } from "@/components/app/segmented";
import {
  MetricLabel,
  MetricValue,
  SummaryBand,
  SummaryCell,
} from "@/components/app/summary";
import { Input } from "@/components/ui/input";
import { apiFetch, errorMessage } from "@/lib/client-api";
import { addDays, formatDate, formatShortDate } from "@/lib/dates";
import { persen, ratio, rupiah } from "@/lib/format";
import type { DateRange, Report, ReportPeriod } from "@/types/reports";

type SortKey = "amount" | "leads" | "rate";

const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: "today", label: "Hari ini" },
  { value: "week", label: "Minggu ini" },
  { value: "month", label: "Bulan ini" },
  { value: "custom", label: "Rentang tanggal" },
];

// "9–12 Nov 2026" untuk rentang, "12 Nov 2026" untuk satu hari.
function rangeLabel(range: DateRange) {
  if (range.from === range.to) return formatDate(range.to);
  const sameYear = range.from.slice(0, 4) === range.to.slice(0, 4);
  return `${sameYear ? formatShortDate(range.from) : formatDate(range.from)} – ${formatDate(range.to)}`;
}

function poin(value: number) {
  return (
    value.toLocaleString("id-ID", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + " poin"
  );
}

// Naik/turun dalam persen terhadap periode pembanding.
function Change({
  current,
  previous,
  children,
}: {
  current: number;
  previous: number;
  children?: React.ReactNode;
}) {
  if (previous === 0)
    return (
      <MutedText>
        {current === 0 ? "Sama-sama nol" : "Periode pembanding nol"}
      </MutedText>
    );
  return (
    <Delta
      diff={current - previous}
      amount={persen(ratio(Math.abs(current - previous), previous))}
    >
      {children}
    </Delta>
  );
}

// Halaman Laporan: pilih periode, lihat rekap per sales (penjualan, leads,
// konversi), bandingkan antar sales, dan bandingkan dengan periode sebelumnya.
export function ReportView({
  initialReport,
  today,
}: {
  initialReport: Report;
  today: string;
}) {
  const [report, setReport] = useState(initialReport);
  const [period, setPeriod] = useState<ReportPeriod>(initialReport.period);
  const [from, setFrom] = useState(addDays(today, -6));
  const [to, setTo] = useState(today);
  const [sortBy, setSortBy] = useState<SortKey>("amount");
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState("");
  const requestId = useRef(0);

  const rangeError =
    period !== "custom"
      ? ""
      : !from || !to
        ? "Isi tanggal mulai dan tanggal akhir."
        : from > to
          ? "Tanggal mulai harus sebelum atau sama dengan tanggal akhir."
          : to > today
            ? "Tanggal akhir tidak boleh setelah hari ini."
            : "";

  async function load(next: ReportPeriod, range?: DateRange) {
    const id = (requestId.current += 1);
    setLoading(true);
    setFailure("");
    try {
      const params = new URLSearchParams({ period: next });
      if (next === "custom" && range) {
        params.set("from", range.from);
        params.set("to", range.to);
      }
      const result = await apiFetch<Report>(`/api/reports?${params}`);
      if (id === requestId.current) setReport(result);
    } catch (error) {
      if (id === requestId.current) setFailure(errorMessage(error));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  function choosePeriod(next: ReportPeriod) {
    setPeriod(next);
    if (next !== "custom") void load(next);
    else if (from && to && from <= to && to <= today)
      void load("custom", { from, to });
  }

  function chooseRange(nextFrom: string, nextTo: string) {
    setFrom(nextFrom);
    setTo(nextTo);
    if (nextFrom && nextTo && nextFrom <= nextTo && nextTo <= today)
      void load("custom", { from: nextFrom, to: nextTo });
  }

  const now = report.totals.current;
  const before = report.totals.previous;
  const rateNow = ratio(now.won, now.leads);
  const rateBefore = ratio(before.won, before.leads);
  const previousLabel = rangeLabel(report.previous);
  const sorted = [...report.rows].sort((a, b) =>
    sortBy === "leads"
      ? b.leads - a.leads
      : sortBy === "rate"
        ? ratio(b.won, b.leads) - ratio(a.won, a.leads)
        : b.amount - a.amount,
  );
  const scaleMax = Math.max(
    1,
    ...report.rows.map((row) => Math.max(row.amount, row.previous.amount)),
  );
  // Laporan yang tampil sudah sesuai pilihan (bukan sisa periode sebelumnya).
  const showReport = !rangeError;

  return (
    <div
      className="@container/page grid max-w-[1440px] gap-6"
      aria-busy={loading}
    >
      <PageHeader>
        <div className="grid gap-1">
          <PageTitle>Laporan</PageTitle>
          <MutedText>
            {showReport
              ? `${rangeLabel(report.current)} · dibandingkan dengan ${previousLabel}`
              : "Pilih rentang tanggal yang valid untuk melihat laporan."}
          </MutedText>
        </div>
        <Segmented
          label="Periode laporan"
          value={period}
          options={PERIODS}
          onChange={choosePeriod}
        />
      </PageHeader>

      {period === "custom" && (
        <div className="grid gap-3 rounded-lg border bg-card px-6 py-4">
          <div className="grid items-end gap-3 @min-[760px]/page:grid-cols-[200px_200px_minmax(0,1fr)]">
            <Field id="report-from" label="Dari tanggal">
              <Input
                id="report-from"
                type="date"
                max={today}
                value={from}
                onChange={(event) => chooseRange(event.target.value, to)}
                {...fieldAria("report-range", undefined, rangeError)}
              />
            </Field>
            <Field id="report-to" label="Sampai tanggal">
              <Input
                id="report-to"
                type="date"
                max={today}
                value={to}
                onChange={(event) => chooseRange(from, event.target.value)}
                {...fieldAria("report-range", undefined, rangeError)}
              />
            </Field>
            <MutedText>
              Pembandingnya rentang dengan panjang yang sama tepat sebelum
              tanggal mulai.
            </MutedText>
          </div>
          {rangeError && (
            <p id="report-range-error" className="text-[13px] text-destructive">
              {rangeError}
            </p>
          )}
        </div>
      )}

      {failure && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-card px-4 py-3 text-destructive"
        >
          {failure}
        </p>
      )}

      {showReport && (
        <>
          <SummaryBand label="Ringkasan periode">
            <SummaryCell>
              <MetricLabel>Total penjualan</MetricLabel>
              <MetricValue>{rupiah(now.amount)}</MetricValue>
              <Change current={now.amount} previous={before.amount}>
                dari {rupiah(before.amount)}
              </Change>
            </SummaryCell>
            <SummaryCell>
              <MetricLabel>Leads</MetricLabel>
              <MetricValue>{now.leads.toLocaleString("id-ID")}</MetricValue>
              <Delta
                diff={now.leads - before.leads}
                amount={Math.abs(now.leads - before.leads)}
              >
                dari {before.leads.toLocaleString("id-ID")} leads
              </Delta>
            </SummaryCell>
            <SummaryCell>
              <MetricLabel>Konversi</MetricLabel>
              <MetricValue>{persen(rateNow)}</MetricValue>
              <Delta
                diff={Number((rateNow - rateBefore).toFixed(1))}
                amount={poin(Math.abs(rateNow - rateBefore))}
              >
                dari {persen(rateBefore)}
              </Delta>
            </SummaryCell>
          </SummaryBand>

          <Panel aria-labelledby="report-recap-title">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="grid gap-1">
                <PanelTitle id="report-recap-title">Rekap per sales</PanelTitle>
                <MutedText>
                  Total penjualan, leads, dan konversi dijumlahkan otomatis.
                </MutedText>
              </div>
              <Field id="report-sort" label="Urutkan" className="w-52">
                <NativeSelect
                  id="report-sort"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortKey)}
                >
                  <option value="amount">Penjualan terbesar</option>
                  <option value="leads">Leads terbanyak</option>
                  <option value="rate">Konversi tertinggi</option>
                </NativeSelect>
              </Field>
            </div>

            {sorted.length > 0 ? (
              <DataTable>
                <TableHead>
                  <Th>Sales</Th>
                  <Th end>Penjualan</Th>
                  <Th>Porsi omzet</Th>
                  <Th end>Transaksi</Th>
                  <Th end>Leads</Th>
                  <Th end>Jadi beli</Th>
                  <Th end>Konversi</Th>
                </TableHead>
                <TableBody>
                  {sorted.map((row) => (
                    <Tr key={row.salesId}>
                      <Td label="Sales" full className="font-medium">
                        {row.name}
                      </Td>
                      <Td label="Penjualan" end mono nowrap>
                        {rupiah(row.amount)}
                      </Td>
                      <Td label="Porsi omzet" full>
                        <span className="flex min-w-36 items-center gap-3">
                          <Bar value={ratio(row.amount, now.amount)} />
                          <span className="min-w-[6ch] flex-none text-right font-mono">
                            {persen(ratio(row.amount, now.amount))}
                          </span>
                        </span>
                      </Td>
                      <Td label="Transaksi" end mono>
                        {row.count}
                      </Td>
                      <Td label="Leads" end mono>
                        {row.leads}
                      </Td>
                      <Td label="Jadi beli" end mono>
                        {row.won}
                      </Td>
                      <Td label="Konversi" end mono>
                        {persen(ratio(row.won, row.leads))}
                      </Td>
                    </Tr>
                  ))}
                </TableBody>
              </DataTable>
            ) : (
              <EmptyState title="Belum ada anggota tim sales.">
                Tambahkan anggota dan catat penjualan untuk melihat rekapnya di
                sini.
              </EmptyState>
            )}
          </Panel>

          {sorted.length > 0 && (
            <Panel aria-labelledby="report-compare-title">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="grid gap-1">
                  <PanelTitle id="report-compare-title">
                    Dibanding periode sebelumnya
                  </PanelTitle>
                  <MutedText>
                    {rangeLabel(report.current)} dibanding {previousLabel}
                  </MutedText>
                </div>
                <ul
                  aria-label="Keterangan grafik"
                  className="flex flex-wrap gap-4 text-[13px] text-muted-foreground"
                >
                  <li className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="size-3 rounded-sm bg-foreground"
                    />
                    Periode ini
                  </li>
                  <li className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="size-3 rounded-sm border border-muted-foreground bg-card"
                    />
                    Periode sebelumnya
                  </li>
                </ul>
              </div>

              <DataTable>
                <TableHead>
                  <Th>Sales</Th>
                  <Th>Perbandingan omzet</Th>
                  <Th end>Periode ini</Th>
                  <Th end>Sebelumnya</Th>
                  <Th>Perubahan</Th>
                </TableHead>
                <TableBody>
                  {sorted.map((row) => (
                    <Tr key={row.salesId}>
                      <Td label="Sales" full className="font-medium">
                        {row.name}
                      </Td>
                      <Td label="Perbandingan omzet" full>
                        <span
                          aria-hidden="true"
                          className="grid min-w-40 gap-1"
                        >
                          <span
                            className="block h-2.5 rounded-sm bg-foreground transition-[width] duration-200 motion-reduce:transition-none"
                            style={{ width: `${ratio(row.amount, scaleMax)}%` }}
                          />
                          <span
                            className={
                              "block h-2.5 rounded-sm bg-card transition-[width] duration-200 motion-reduce:transition-none" +
                              (row.previous.amount > 0
                                ? " border border-muted-foreground"
                                : "")
                            }
                            style={{
                              width: `${ratio(row.previous.amount, scaleMax)}%`,
                            }}
                          />
                        </span>
                      </Td>
                      <Td label="Periode ini" end mono nowrap>
                        {rupiah(row.amount)}
                      </Td>
                      <Td label="Sebelumnya" end mono muted nowrap>
                        {rupiah(row.previous.amount)}
                      </Td>
                      <Td label="Perubahan">
                        <Change
                          current={row.amount}
                          previous={row.previous.amount}
                        />
                      </Td>
                    </Tr>
                  ))}
                </TableBody>
              </DataTable>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
