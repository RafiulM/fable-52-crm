import type {
  DashboardData,
  DashboardTransaction,
  SalesStat,
} from "@/types/dashboard";

// Menghitung ulang semua angka dashboard setelah ada transaksi hari ini yang
// baru dicatat: ringkasan, perbandingan sales, tren mingguan, tren harian,
// dan daftar transaksi. Fungsi murni, tidak mengubah `data`.
export function withNewTransactions(
  data: DashboardData,
  added: DashboardTransaction[],
): DashboardData {
  if (added.length === 0) return data;

  const total = added.reduce((sum, item) => sum + item.amount, 0);
  const bySales = new Map<string, { amount: number; count: number }>();
  for (const item of added) {
    const entry = bySales.get(item.salesId) ?? { amount: 0, count: 0 };
    entry.amount += item.amount;
    entry.count += 1;
    bySales.set(item.salesId, entry);
  }
  const bump = (rows: SalesStat[]) =>
    rows.map((row) => {
      const extra = bySales.get(row.salesId);
      return extra
        ? {
            ...row,
            amount: row.amount + extra.amount,
            count: row.count + extra.count,
          }
        : row;
    });

  return {
    ...data,
    summary: {
      ...data.summary,
      today: {
        ...data.summary.today,
        amount: data.summary.today.amount + total,
        count: data.summary.today.count + added.length,
      },
    },
    comparison: {
      today: bump(data.comparison.today),
      week: bump(data.comparison.week),
      month: bump(data.comparison.month),
    },
    week: data.week.map((day) =>
      day.date === data.today
        ? { ...day, current: (day.current ?? 0) + total }
        : day,
    ),
    daily: data.daily.map((day) =>
      day.date === data.today ? { ...day, amount: day.amount + total } : day,
    ),
    transactions: [...added, ...data.transactions],
  };
}
