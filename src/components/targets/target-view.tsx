"use client";

import { useRef, useState, type FormEvent } from "react";
import { CircleCheck } from "lucide-react";
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
import { Field, MoneyInput, NativeSelect } from "@/components/app/field";
import { Notice, type NoticeState } from "@/components/app/notice";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, errorMessage } from "@/lib/client-api";
import { formatLongDate, formatMonth, monthKey } from "@/lib/dates";
import { formatDigits, onlyDigits, persen, ratio, rupiah } from "@/lib/format";
import type { TargetMode, TargetPeriod, TargetRow } from "@/types/targets";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

// Isian target sebagai teks berformat ribuan; kosong berarti belum ada target.
function toDraft(rows: TargetRow[]) {
  return Object.fromEntries(
    rows.map((row) => [
      row.salesId,
      row.target > 0 ? formatDigits(String(row.target)) : "",
    ]),
  );
}

function Progress({ target, achieved }: { target: number; achieved: number }) {
  if (target <= 0) return <MutedText>Belum ada target</MutedText>;
  const reached = achieved >= target;
  return (
    <span className="grid min-w-40 gap-1">
      <span className="flex items-center gap-3">
        <Bar value={ratio(achieved, target)} />
        <span className="min-w-[7ch] flex-none text-right font-mono">
          {persen(ratio(achieved, target))}
        </span>
      </span>
      <span
        className={
          "inline-flex items-center gap-1 text-[13px] " +
          (reached ? "text-positive" : "text-muted-foreground")
        }
      >
        {reached && <CircleCheck className="size-3.5" aria-hidden="true" />}
        {reached ? "Tercapai" : `Kurang ${rupiah(target - achieved)}`}
      </span>
    </span>
  );
}

// Halaman Target: atur target harian atau bulanan tiap sales, dan pantau
// pencapaiannya dalam persen. Pencapaian dihitung server dari transaksi.
export function TargetView({
  initialRows,
  today,
}: {
  initialRows: TargetRow[];
  today: string;
}) {
  const [mode, setMode] = useState<TargetMode>("daily");
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(monthKey(today));
  const [rows, setRows] = useState(initialRows);
  const [draft, setDraft] = useState(() => toDraft(initialRows));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);
  const requestId = useRef(0);

  const period: TargetPeriod =
    mode === "daily" ? { mode, date } : { mode, month };
  const periodLabel =
    mode === "daily" ? formatLongDate(date) : formatMonth(`${month}-01`);
  const view = rows.map((row) => ({
    ...row,
    draftTarget: Number(onlyDigits(draft[row.salesId] ?? "")),
  }));
  const teamTarget = view.reduce((sum, row) => sum + row.draftTarget, 0);
  const teamAchieved = view.reduce((sum, row) => sum + row.achieved, 0);
  const withTarget = view.filter((row) => row.draftTarget > 0).length;
  const changed = view.filter((row) => row.draftTarget !== row.target);
  const dirty = changed.length > 0;

  function query(next: TargetPeriod) {
    return next.mode === "daily"
      ? `mode=daily&date=${next.date}`
      : `mode=monthly&month=${next.month}`;
  }

  // Ganti periode: ambil target dan pencapaian periode itu dari server.
  // Perubahan yang belum disimpan dibuang, dan pengguna diberi tahu.
  async function changePeriod(next: TargetPeriod) {
    if (next.mode === "daily" && !next.date) return;
    const hadChanges = dirty;
    setMode(next.mode);
    if (next.mode === "daily") setDate(next.date);
    else setMonth(next.month);

    const id = (requestId.current += 1);
    setLoading(true);
    try {
      const board = await apiFetch<TargetRow[]>(`/api/targets?${query(next)}`);
      if (id !== requestId.current) return;
      setRows(board);
      setDraft(toDraft(board));
      setNotice(
        hadChanges
          ? {
              tone: "error",
              message:
                "Perubahan target yang belum disimpan dibatalkan karena periode diganti.",
            }
          : null,
      );
    } catch (error) {
      if (id === requestId.current)
        setNotice({ tone: "error", message: errorMessage(error) });
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const board = await apiFetch<TargetRow[]>("/api/targets", {
        method: "PUT",
        body: {
          ...period,
          targets: changed.map((row) => ({
            salesMemberId: row.salesId,
            amount: row.draftTarget,
          })),
        },
      });
      setRows(board);
      setDraft(toDraft(board));
      setNotice({
        tone: "success",
        message: `Target ${mode === "daily" ? "harian" : "bulanan"} ${periodLabel} tersimpan untuk ${changed.length} sales.`,
      });
    } catch (error) {
      setNotice({ tone: "error", message: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  const [year, monthNumber] = month.split("-").map(Number);
  const thisYear = Number(today.slice(0, 4));
  const years = [
    ...new Set([thisYear - 1, thisYear, thisYear + 1, year]),
  ].sort();

  return (
    <div className="@container/page grid max-w-[1440px] gap-6">
      <div className="grid gap-4">
        <PageHeader>
          <div className="grid gap-1">
            <PageTitle>Target</PageTitle>
            <MutedText>
              Target {mode === "daily" ? "harian" : "bulanan"} · {periodLabel}
            </MutedText>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <Segmented
              label="Jenis target"
              value={mode}
              options={[
                { value: "daily", label: "Harian" },
                { value: "monthly", label: "Bulanan" },
              ]}
              onChange={(next) =>
                changePeriod(
                  next === "daily"
                    ? { mode: "daily", date }
                    : { mode: "monthly", month },
                )
              }
            />
            {mode === "daily" ? (
              <Field id="target-date" label="Tanggal" className="w-44">
                <Input
                  id="target-date"
                  type="date"
                  value={date}
                  onChange={(event) =>
                    changePeriod({ mode: "daily", date: event.target.value })
                  }
                />
              </Field>
            ) : (
              <>
                <Field id="target-month" label="Bulan" className="w-36">
                  <NativeSelect
                    id="target-month"
                    value={monthNumber}
                    onChange={(event) =>
                      changePeriod({
                        mode: "monthly",
                        month: `${year}-${event.target.value.padStart(2, "0")}`,
                      })
                    }
                  >
                    {MONTH_NAMES.map((name, index) => (
                      <option key={name} value={index + 1}>
                        {name}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field id="target-year" label="Tahun" className="w-24">
                  <NativeSelect
                    id="target-year"
                    value={year}
                    onChange={(event) =>
                      changePeriod({
                        mode: "monthly",
                        month: `${event.target.value}-${String(monthNumber).padStart(2, "0")}`,
                      })
                    }
                  >
                    {years.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              </>
            )}
          </div>
        </PageHeader>
        <Notice notice={notice} onDismiss={() => setNotice(null)} />
      </div>

      <SummaryBand label="Pencapaian tim">
        <SummaryCell>
          <MetricLabel>Target tim</MetricLabel>
          <MetricValue>{rupiah(teamTarget)}</MetricValue>
          <MutedText>
            {withTarget} dari {view.length} sales punya target
          </MutedText>
        </SummaryCell>
        <SummaryCell>
          <MetricLabel>Penjualan tercapai</MetricLabel>
          <MetricValue>{rupiah(teamAchieved)}</MetricValue>
          <MutedText>
            {teamTarget <= 0
              ? "Belum ada target untuk dibandingkan"
              : teamAchieved >= teamTarget
                ? "Target tim tercapai"
                : `Kurang ${rupiah(teamTarget - teamAchieved)}`}
          </MutedText>
        </SummaryCell>
        <SummaryCell>
          <MetricLabel>Pencapaian tim</MetricLabel>
          <MetricValue>
            {teamTarget > 0 ? persen(ratio(teamAchieved, teamTarget)) : "—"}
          </MetricValue>
          <span className="flex">
            <Bar value={ratio(teamAchieved, teamTarget)} />
          </span>
        </SummaryCell>
      </SummaryBand>

      <Panel aria-labelledby="target-table-title" aria-busy={loading}>
        <div className="grid gap-1">
          <PanelTitle id="target-table-title">Target per sales</PanelTitle>
          <MutedText>
            Ubah nominal, pencapaian langsung dihitung ulang. Kosongkan kalau
            belum ada target.
          </MutedText>
        </div>

        {view.length > 0 ? (
          <form
            noValidate
            method="post"
            onSubmit={handleSave}
            className="grid gap-4"
          >
            <DataTable>
              <TableHead>
                <Th>Sales</Th>
                <Th>Target</Th>
                <Th end>Tercapai</Th>
                <Th>Pencapaian</Th>
              </TableHead>
              <TableBody>
                {view.map((row) => (
                  <Tr key={row.salesId}>
                    <Td label="Sales" full className="font-medium">
                      {row.name}
                    </Td>
                    <Td label="Target" full>
                      <span className="block max-w-[220px] min-w-[168px]">
                        <MoneyInput
                          name={`target-${row.salesId}`}
                          aria-label={`Target ${row.name}`}
                          value={draft[row.salesId] ?? ""}
                          disabled={loading}
                          onValueChange={(value) =>
                            setDraft((current) => ({
                              ...current,
                              [row.salesId]: value,
                            }))
                          }
                        />
                      </span>
                    </Td>
                    <Td label="Tercapai" end mono nowrap>
                      {rupiah(row.achieved)}
                    </Td>
                    <Td label="Pencapaian" full>
                      <Progress
                        target={row.draftTarget}
                        achieved={row.achieved}
                      />
                    </Td>
                  </Tr>
                ))}
              </TableBody>
            </DataTable>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t pt-4">
              <MutedText id="target-save-hint">
                {dirty
                  ? `${changed.length} target berubah dan belum disimpan.`
                  : "Belum ada perubahan untuk disimpan."}
              </MutedText>
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={!dirty || saving}
                onClick={() => setDraft(toDraft(rows))}
              >
                Batalkan
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={!dirty || saving}
                aria-describedby="target-save-hint"
              >
                {saving ? "Menyimpan…" : "Simpan target"}
              </Button>
            </div>
          </form>
        ) : (
          <EmptyState title="Belum ada anggota tim sales.">
            Tambahkan anggota di halaman Tim Sales, lalu atur targetnya di sini.
          </EmptyState>
        )}
      </Panel>
    </div>
  );
}
