import type { Metadata } from "next";
import { TransactionsView } from "@/components/transactions/transactions-view";
import { todayIso } from "@/lib/dates";
import { requireSession } from "@/lib/session";
import { getMockTransactions, MOCK_SALES_MEMBERS } from "@/mocks/transactions";

export const metadata: Metadata = { title: "Catat Penjualan" };

export default async function TransactionsPage() {
  await requireSession();
  // Sementara memakai data tiruan; nanti diganti layanan transaksi.
  return (
    <TransactionsView
      initialTransactions={getMockTransactions()}
      salesMembers={MOCK_SALES_MEMBERS}
      today={todayIso()}
    />
  );
}
