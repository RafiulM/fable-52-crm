import { cn } from "cn";
import { Delta } from "@/components/app/delta";
import { MutedText } from "@/components/app/panel";
import { persen, ratio, rupiah } from "@/lib/format";
import type { DashboardData } from "@/types/dashboard";

function Cell({
  wide,
  children,
}: {
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid min-w-0 content-start gap-2 bg-card p-6",
        // Sel total melebar satu baris penuh saat ringkasan hanya 3 kolom.
        wide && "@min-[600px]/page:col-span-3 @min-[960px]/page:col-span-1",
      )}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] leading-[1.23] font-semibold tracking-[0.01em] text-muted-foreground">
      {children}
    </p>
  );
}

function Value({
  total,
  children,
}: {
  total?: boolean;
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "font-mono text-[25px] leading-[1.1] [overflow-wrap:anywhere] @min-[420px]/page:text-[40px]",
        total && "@min-[1100px]/page:text-[48px]",
      )}
    >
      {children}
    </p>
  );
}

// Angka besar di bagian atas dashboard: penjualan, transaksi, dan leads hari
// ini dibanding kemarin, plus konversi leads bulan berjalan.
export function SummaryBand({ summary }: { summary: DashboardData["summary"] }) {
  const { today, yesterday, monthLeads } = summary;
  const amountDiff = today.amount - yesterday.amount;

  return (
    <section
      aria-label="Ringkasan hari ini"
      className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border bg-border @min-[600px]/page:grid-cols-3 @min-[960px]/page:grid-cols-[minmax(0,2.2fr)_repeat(3,minmax(0,1fr))]"
    >
      <Cell wide>
        <Label>Total penjualan hari ini</Label>
        <Value total>{rupiah(today.amount)}</Value>
        {yesterday.amount > 0 ? (
          <Delta
            diff={amountDiff}
            amount={persen(ratio(Math.abs(amountDiff), yesterday.amount))}
          >
            dari kemarin ({rupiah(yesterday.amount)})
          </Delta>
        ) : (
          <MutedText>Kemarin belum ada penjualan</MutedText>
        )}
      </Cell>
      <Cell>
        <Label>Transaksi hari ini</Label>
        <Value>{today.count}</Value>
        <Delta
          diff={today.count - yesterday.count}
          amount={Math.abs(today.count - yesterday.count)}
        >
          dari kemarin ({yesterday.count})
        </Delta>
      </Cell>
      <Cell>
        <Label>Leads baru hari ini</Label>
        <Value>{today.leads}</Value>
        <Delta
          diff={today.leads - yesterday.leads}
          amount={Math.abs(today.leads - yesterday.leads)}
        >
          dari kemarin ({yesterday.leads})
        </Delta>
      </Cell>
      <Cell>
        <Label>Konversi bulan ini</Label>
        <Value>{persen(ratio(monthLeads.won, monthLeads.total))}</Value>
        <MutedText>
          {monthLeads.total > 0
            ? `${monthLeads.won} dari ${monthLeads.total} leads jadi beli`
            : "Belum ada leads bulan ini"}
        </MutedText>
      </Cell>
    </section>
  );
}
