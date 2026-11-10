"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { AppDialog } from "@/components/app/app-dialog";
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
import { Field, NativeSelect } from "@/components/app/field";
import { Notice, type NoticeState } from "@/components/app/notice";
import {
  MutedText,
  PageHeader,
  PageTitle,
  Panel,
  PanelTitle,
} from "@/components/app/panel";
import { LeadForm } from "@/components/leads/lead-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRelativeDate, todayIso } from "@/lib/dates";
import { persen, ratio } from "@/lib/format";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  WON_STATUS,
  type LeadStatus,
} from "@/lib/lead-status";
import type { SalesMemberOption } from "@/types/dashboard";
import type { LeadInput, LeadItem } from "@/types/leads";

// Halaman Leads & Kontak: konversi tiap sales di kiri (dihitung otomatis dari
// status lead), daftar leads dengan filter dan ubah status di kanan.
export function LeadsView({
  initialLeads,
  salesMembers,
  today,
}: {
  initialLeads: LeadItem[];
  salesMembers: SalesMemberOption[];
  today: string;
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [filterSales, setFilterSales] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);
  const sequence = useRef(0);

  // Semua sales yang relevan: yang aktif, plus pemilik lead lama yang nonaktif.
  const members = [
    ...new Map(
      [
        ...salesMembers.map((member) => [member.id, member.name] as const),
        ...leads.map((lead) => [lead.salesMemberId, lead.salesName] as const),
      ].sort((a, b) => a[1].localeCompare(b[1])),
    ),
  ];

  const conversion = members.map(([id, name]) => {
    const own = leads.filter((lead) => lead.salesMemberId === id);
    const won = own.filter((lead) => lead.status === WON_STATUS).length;
    return { id, name, total: own.length, won };
  });
  const totalWon = leads.filter((lead) => lead.status === WON_STATUS).length;

  const needle = query.trim().toLowerCase();
  const visible = leads.filter(
    (lead) =>
      (!filterSales || lead.salesMemberId === filterSales) &&
      (!filterStatus || lead.status === filterStatus) &&
      (!needle ||
        lead.name.toLowerCase().includes(needle) ||
        lead.contact.toLowerCase().includes(needle)),
  );
  const filtered = Boolean(filterSales || filterStatus || needle);

  function salesName(id: string) {
    return members.find(([memberId]) => memberId === id)?.[1] ?? "Sales";
  }

  async function createLead(input: LeadInput) {
    sequence.current += 1;
    const created: LeadItem = {
      id: `baru-${sequence.current}`,
      ...input,
      salesName: salesName(input.salesMemberId),
      leadDate: today,
      updatedAt: new Date().toISOString(),
    };
    setLeads((list) => [created, ...list]);
    setAdding(false);
    setNotice({
      tone: "success",
      message: `Lead ${created.name} ditambahkan untuk ${created.salesName}.`,
    });
  }

  async function changeStatus(lead: LeadItem, status: LeadStatus) {
    setLeads((list) =>
      list.map((item) =>
        item.id === lead.id
          ? { ...item, status, updatedAt: new Date().toISOString() }
          : item,
      ),
    );
    setNotice({
      tone: "success",
      message: `Status ${lead.name} diubah menjadi ${LEAD_STATUS_LABELS[status]}. Konversi dihitung ulang.`,
    });
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
          <div className="grid gap-1">
            <PanelTitle id="leads-conversion-title">
              Konversi per sales
            </PanelTitle>
            <p className="font-mono text-[25px] leading-[1.2]">
              {persen(ratio(totalWon, leads.length))}
            </p>
            <MutedText>
              {totalWon} dari {leads.length} leads tim jadi beli
            </MutedText>
          </div>

          {conversion.length > 0 ? (
            <ul className="grid gap-4">
              {conversion.map((row) => (
                <li key={row.id} className="grid gap-2">
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

        <Panel aria-labelledby="leads-list-title">
          <div className="grid gap-1">
            <PanelTitle id="leads-list-title">Daftar leads</PanelTitle>
            <MutedText>
              {visible.length} dari {leads.length} leads
              {filtered && " · sesuai filter"}
            </MutedText>
          </div>

          <div className="grid items-end gap-3 @min-[641px]/panel:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto]">
            <Field id="leads-filter-sales" label="Sales">
              <NativeSelect
                id="leads-filter-sales"
                value={filterSales}
                onChange={(event) => setFilterSales(event.target.value)}
              >
                <option value="">Semua sales</option>
                {members.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
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

          {visible.length > 0 ? (
            <DataTable>
              <TableHead>
                <Th>Calon pembeli</Th>
                <Th>Sales</Th>
                <Th>Status</Th>
                <Th>Catatan</Th>
                <Th end>Diperbarui</Th>
              </TableHead>
              <TableBody>
                {visible.map((lead) => (
                  <Tr key={lead.id}>
                    <Td label="Calon pembeli" full>
                      <span className="grid gap-1">
                        <span className="font-medium">{lead.name}</span>
                        <span className="font-mono text-[13px] text-muted-foreground">
                          {lead.contact || "Belum ada kontak"}
                        </span>
                      </span>
                    </Td>
                    <Td label="Sales" nowrap>
                      {lead.salesName}
                    </Td>
                    <Td label="Status">
                      <NativeSelect
                        aria-label={`Status ${lead.name}`}
                        value={lead.status}
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
                      {formatRelativeDate(
                        todayIso(new Date(lead.updatedAt)),
                        today,
                      )}
                    </Td>
                  </Tr>
                ))}
              </TableBody>
            </DataTable>
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
