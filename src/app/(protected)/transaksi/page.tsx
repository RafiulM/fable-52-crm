import type { Metadata } from "next";
import { TransactionsView } from "@/components/transactions/transactions-view";
import { todayIso } from "@/lib/dates";
import { requireSession } from "@/lib/session";
import { listSalesMembers } from "@/services/sales-members.service";
import { listTransactions } from "@/services/transactions.service";

export const metadata: Metadata = { title: "Catat Penjualan" };

export default async function TransactionsPage() {
  const { user } = await requireSession();
  const [history, members] = await Promise.all([
    listTransactions(user.id, { limit: 50, offset: 0 }),
    listSalesMembers(user.id),
  ]);

  return (
    <TransactionsView
      initialTransactions={history.data.map((item) => ({
        id: item.id,
        salesMemberId: item.salesMemberId,
        salesName: item.salesName,
        amount: item.amount,
        productDescription: item.productDescription,
        transactionDate: item.transactionDate,
        createdAt: item.createdAt.toISOString(),
      }))}
      initialMeta={history.meta}
      salesMembers={members
        .filter((member) => member.isActive)
        .map(({ id, name }) => ({ id, name }))}
      filterMembers={members.map(({ id, name }) => ({ id, name }))}
      today={todayIso()}
    />
  );
}
