import { Badge } from "@/components/app/badge";
import { MutedText, Panel, PanelTitle } from "@/components/app/panel";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/dates";
import { rupiah } from "@/lib/format";
import type {
  DashboardTransaction,
  SalesMemberOption,
} from "@/types/dashboard";

// Daftar transaksi hari ini, terbaru dulu. Bisa disaring ke satu sales
// lewat bagan perbandingan.
export function TodayTransactions({
  transactions,
  newIds,
  selectedSales,
  onClearFilter,
}: {
  transactions: DashboardTransaction[];
  // Transaksi yang dicatat di sesi ini; diberi tanda "Baru".
  newIds: string[];
  selectedSales: SalesMemberOption | null;
  onClearFilter: () => void;
}) {
  const visible = selectedSales
    ? transactions.filter((item) => item.salesId === selectedSales.id)
    : transactions;
  const total = visible.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Panel aria-labelledby="dashboard-transactions-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <PanelTitle id="dashboard-transactions-title">
            Transaksi hari ini
          </PanelTitle>
          <MutedText>
            {visible.length} transaksi · {rupiah(total)}
            {selectedSales && ` · Disaring: ${selectedSales.name}`}
          </MutedText>
        </div>
        {selectedSales && (
          <Button variant="outline" size="sm" onClick={onClearFilter}>
            Tampilkan semua sales
          </Button>
        )}
      </div>

      {visible.length > 0 ? (
        <ul>
          {visible.map((item) => (
            <li
              key={item.id}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1 border-t py-3 [grid-template-areas:'time_name_amount'_'time_product_amount'] @min-[561px]/panel:grid-cols-[56px_minmax(0,220px)_minmax(0,1fr)_auto] @min-[561px]/panel:gap-x-4 @min-[561px]/panel:[grid-template-areas:'time_name_product_amount']"
            >
              <span className="font-mono text-[13px] text-muted-foreground [grid-area:time]">
                {formatTime(item.createdAt)}
              </span>
              <span className="flex min-w-0 flex-wrap items-center gap-2 font-medium [grid-area:name]">
                {item.salesName}
                {newIds.includes(item.id) && <Badge>Baru</Badge>}
              </span>
              <span className="min-w-0 text-muted-foreground [grid-area:product]">
                {item.product || "Tanpa keterangan"}
              </span>
              <span className="text-right font-mono whitespace-nowrap [grid-area:amount]">
                {rupiah(item.amount)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-t pt-6 pb-2 text-muted-foreground">
          {selectedSales
            ? `Belum ada transaksi hari ini untuk ${selectedSales.name}.`
            : "Belum ada transaksi hari ini."}
        </p>
      )}
    </Panel>
  );
}
