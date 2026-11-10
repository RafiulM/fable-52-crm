"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { AppDialog } from "@/components/app/app-dialog";
import { Bar } from "@/components/app/bar";
import {
  DataTable,
  EmptyState,
  GroupRow,
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
import { Segmented } from "@/components/app/segmented";
import { LeadForm } from "@/components/leads/lead-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, apiFetchList, errorMessage } from "@/lib/client-api";
import { formatRelativeDate, todayIso } from "@/lib/dates";
import { persen, ratio } from "@/lib/format";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type LeadStatus,
} from "@/lib/lead-status";
import type { SalesMemberOption } from "@/types/dashboard";
import type {
  LeadConversionRow,
  LeadInput,
  LeadItem,
  LeadListMeta,
} from "@/types/leads";

const PAGE_SIZE = 100;
type Grouping = "sales" | "none";
type ConversionPeriod = "month" | "all";

// Halaman Leads & Kontak: konversi tiap sales di kiri (dihitung server dari
// status lead), daftar leads dengan filter dan ubah status di kanan.
export function LeadsView({
  initialLeads,
  initialMeta,
  initialConversion,
  salesMembers,
  filterMembers,
  today,
}: {
  initialLeads: LeadItem[];
  initialMeta: LeadListMeta;
  // Konversi bulan berjalan.
  initialConversion: LeadConversionRow[];
  // Sales aktif, untuk lead baru.
  salesMembers: SalesMemberOption[];
  // Semua sales termasuk yang nonaktif, untuk menyaring daftar.
  filterMembers: SalesMemberOption[];
  today: string;
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [meta, setMeta] = useState(initialMeta);
  const [conversion, setConversion] = useState(initialConversion);
  const [period, setPeriod] = useState<ConversionPeriod>("month");
  const [grouping, setGrouping] = useState<Grouping>("sales");
  const [filterSales, setFilterSales] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadFailure, setLoadFailure] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);
  // Hanya jawaban permintaan terakhir yang dipakai; yang lebih lama diabaikan.
  const requestId = useRef(0);
  const firstRender = useRef(true);

  const needle = query.trim();
  const filtered = Boolean(filterSales || filterStatus || needle);
  const totalLeads = conversion.reduce((sum, row) => sum + row.total, 0);
  const totalWon = conversion.reduce((sum, row) => sum + row.won, 0);

  async function load(offset: number, sort: Grouping = grouping) {
    const id = (requestId.current += 1);
    setLoading(true);
    setLoadFailure("");
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
        sort: sort === "sales" ? "sales" : "recent",
      });
      if (filterSales) params.set("salesMemberId", filterSales);
      if (filterStatus) params.set("status", filterStatus);
      if (needle) params.set("q", needle);
      const result = await apiFetchList<LeadItem, LeadListMeta>(
        `/api/leads?${params}`,
      );
      if (id !== requestId.current) return;
      setLeads((current) =>
        offset === 0 ? result.data : [...current, ...result.data],
      );
      setMeta(result.meta);
    } catch (error) {
      if (id === requestId.current) setLoadFailure(errorMessage(error));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  async function loadConversion(next: ConversionPeriod = period) {
    try {
      setConversion(
        await apiFetch<LeadConversionRow[]>(
          `/api/leads/conversion?period=${next}`,
        ),
      );
    } catch (error) {
      setNotice({ tone: "error", message: errorMessage(error) });
    }
  }

  // Muat ulang daftar saat filter atau susunan berubah. Ketikan pencarian
  // ditunggu sebentar supaya tidak meminta data di setiap huruf.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      void load(0);
    }, 300);
    return () => window.clearTimeout(timer);
    // `load` membaca filter dari state render ini; cukup dipicu oleh nilainya.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSales, filterStatus, needle, grouping]);

  function changePeriod(next: ConversionPeriod) {
    setPeriod(next);
    void loadConversion(next);
  }

  async function createLead(input: LeadInput) {
    const created = await apiFetch<LeadItem>("/api/leads", {
      method: "POST",
      body: input,
    });
    setAdding(false);
    setNotice({
      tone: "success",
      message: `Lead ${created.name} ditambahkan untuk ${created.salesName}.`,
    });
    await Promise.all([load(0), loadConversion()]);
  }

  async function changeStatus(lead: LeadItem, status: LeadStatus) {
    setSavingId(lead.id);
    try {
      const updated = await apiFetch<LeadItem>(`/api/leads/${lead.id}`, {
        method: "PATCH",
        body: { status },
      });
      setLeads((list) =>
        list.map((item) => (item.id === updated.id ? updated : item)),
      );
      setNotice({
        tone: "success",
        message: `Status ${lead.name} diubah menjadi ${LEAD_STATUS_LABELS[status]}. Konversi dihitung ulang.`,
      });
      // Jumlah per sales dan konversi berubah; ambil ulang dari server.
      await Promise.all([loadConversion(), load(0)]);
    } catch (error) {
      setNotice({ tone: "error", message: errorMessage(error) });
    } finally {
      setSavingId(null);
    }
  }

  // Leads yang sudah dimuat, dikelompokkan per sales. Tiap sales hanya punya
  // satu kelompok walau datanya belum berurutan per sales (mis. sesaat setelah
  // susunan diganti), supaya key kelompok tidak pernah ganda.
  const groupsBySales = new Map<
    string,
    { id: string; name: string; leads: LeadItem[] }
  >();
  for (const lead of leads) {
    const group = groupsBySales.get(lead.salesMemberId);
    if (group) group.leads.push(lead);
    else
      groupsBySales.set(lead.salesMemberId, {
        id: lead.salesMemberId,
        name: lead.salesName,
        leads: [lead],
      });
  }
  const groups = [...groupsBySales.values()];

  function renderRow(lead: LeadItem, showSales: boolean) {
    return (
      <Tr key={lead.id}>
        <Td label="Calon pembeli" full>
          <span className="grid gap-1">
            <span className="font-medium">{lead.name}</span>
            <span className="font-mono text-[13px] text-muted-foreground">
              {lead.contact || "Belum ada kontak"}
            </span>
          </span>
        </Td>
        {showSales && (
          <Td label="Sales" nowrap>
            {lead.salesName}
          </Td>
        )}
        <Td label="Status">
          <NativeSelect
            aria-label={`Status ${lead.name}`}
            value={lead.status}
            disabled={savingId === lead.id}
            onChange={(event) =>
              changeStatus(lead, event.target.value as LeadStatus)
            }
            className="min-w-[7.5rem]"
          >
            {LEAD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {LEAD_STATUS_LABELS[status]}
              </option>
            ))}
          </NativeSelect>
        </Td>
        <Td label="Catatan" muted>
          {lead.notes || "—"}
        </Td>
        <Td label="Diperbarui" end mono muted nowrap>
          {formatRelativeDate(todayIso(new Date(lead.updatedAt)), today)}
        </Td>
      </Tr>
    );
  }

  return (
    <div className="@container/page grid max-w-[1440px] gap-6">
      <div className="grid gap-4">
        <PageHeader>
          <div className="grid gap-1">
            <PageTitle>Leads &amp; Kontak</PageTitle>
            <MutedText>
              Calon pembeli tiap sales. Konversi dihitung otomatis dari status
              lead.
            </MutedText>
          </div>
          <Button size="lg" onClick={() => setAdding(true)}>
            <Plus aria-hidden="true" />
            Tambah lead
          </Button>
        </PageHeader>
        <Notice notice={notice} onDismiss={() => setNotice(null)} />
      </div>

      <div className="grid items-start gap-6 @min-[1000px]/page:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <Panel aria-labelledby="leads-conversion-title">
          <div className="grid gap-3">
            <PanelTitle id="leads-conversion-title">
              Konversi per sales
            </PanelTitle>
            <Segmented
              label="Periode konversi"
              value={period}
              options={[
                { value: "month", label: "Bulan ini" },
                { value: "all", label: "Semua waktu" },
              ]}
              onChange={changePeriod}
              className="justify-self-start"
            />
            <div className="grid gap-1">
              <p className="font-mono text-[25px] leading-[1.2]">
                {persen(ratio(totalWon, totalLeads))}
              </p>
              <MutedText>
                {totalWon.toLocaleString("id-ID")} dari{" "}
                {totalLeads.toLocaleString("id-ID")} leads tim jadi beli
              </MutedText>
            </div>
          </div>

          {conversion.length > 0 ? (
            <ul className="grid gap-4">
              {conversion.map((row) => (
                <li key={row.salesId} className="grid gap-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium">{row.name}</span>
                    <span className="font-mono">
                      {persen(ratio(row.won, row.total))}
                    </span>
                  </div>
                  <div className="flex">
                    <Bar value={ratio(row.won, row.total)} />
                  </div>
                  <MutedText>
                    {row.won} jadi beli dari {row.total} leads
                  </MutedText>
                </li>
              ))}
            </ul>
          ) : (
            <MutedText className="border-t pt-4 text-[15px]">
              Belum ada anggota tim sales.
            </MutedText>
          )}
        </Panel>

        <Panel aria-labelledby="leads-list-title" aria-busy={loading}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="grid gap-1">
              <PanelTitle id="leads-list-title">Daftar leads</PanelTitle>
              <MutedText>
                {meta.total.toLocaleString("id-ID")} leads
                {filtered && " · sesuai filter"}
              </MutedText>
            </div>
            <Segmented
              label="Susunan daftar"
              value={grouping}
              options={[
                { value: "sales", label: "Per sales" },
                { value: "none", label: "Terbaru" },
              ]}
              onChange={setGrouping}
            />
          </div>

          <div className="grid items-end gap-3 @min-[641px]/panel:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto]">
            <Field id="leads-filter-sales" label="Sales">
              <NativeSelect
                id="leads-filter-sales"
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
            <Field id="leads-filter-status" label="Status">
              <NativeSelect
                id="leads-filter-status"
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value)}
              >
                <option value="">Semua status</option>
                {LEAD_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {LEAD_STATUS_LABELS[status]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field id="leads-filter-query" label="Cari nama atau kontak">
              <Input
                id="leads-filter-query"
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
                setFilterStatus("");
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

          {leads.length > 0 ? (
            <DataTable>
              <TableHead>
                <Th>Calon pembeli</Th>
                {grouping === "none" && <Th>Sales</Th>}
                <Th>Status</Th>
                <Th>Catatan</Th>
                <Th end>Diperbarui</Th>
              </TableHead>
              <TableBody>
                {grouping === "sales"
                  ? groups.map((group) => {
                      const counts = meta.bySales.find(
                        (row) => row.salesMemberId === group.id,
                      );
                      return (
                        <Fragment key={group.id}>
                          <GroupRow colSpan={4}>
                            <span className="font-medium">{group.name}</span>
                            {counts && (
                              <span className="text-[13px] text-muted-foreground">
                                {" "}
                                · {counts.total} leads · {counts.won} jadi beli
                              </span>
                            )}
                          </GroupRow>
                          {group.leads.map((lead) => renderRow(lead, false))}
                        </Fragment>
                      );
                    })
                  : leads.map((lead) => renderRow(lead, true))}
              </TableBody>
            </DataTable>
          ) : loading ? (
            <MutedText className="border-t pt-6 pb-2 text-[15px]">
              Memuat leads…
            </MutedText>
          ) : filtered ? (
            <EmptyState title="Tidak ada lead yang cocok dengan filter.">
              Ubah pilihan sales, status, atau kata pencarian, atau hapus filter
              untuk melihat semua lead.
            </EmptyState>
          ) : (
            <EmptyState title="Belum ada lead yang dicatat.">
              Tekan Tambah lead untuk menyimpan calon pembeli pertama dan
              menugaskannya ke seorang sales.
            </EmptyState>
          )}

          {leads.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <MutedText>
                Menampilkan {leads.length.toLocaleString("id-ID")} dari{" "}
                {meta.total.toLocaleString("id-ID")} leads
              </MutedText>
              {meta.hasMore && (
                <Button
                  variant="outline"
                  disabled={loading}
                  onClick={() => load(leads.length)}
                >
                  {loading ? "Memuat…" : "Muat lebih banyak"}
                </Button>
              )}
            </div>
          )}
        </Panel>
      </div>

      <AppDialog
        open={adding}
        onOpenChange={setAdding}
        title="Tambah lead"
        description="Simpan calon pembeli dan tugaskan ke sales penanggung jawabnya."
      >
        {salesMembers.length > 0 ? (
          <LeadForm
            salesMembers={salesMembers}
            onSubmit={createLead}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <p className="text-muted-foreground">
            Belum ada anggota tim sales yang aktif. Tambahkan anggota dulu
            sebelum mencatat lead.
          </p>
        )}
      </AppDialog>
    </div>
  );
}
