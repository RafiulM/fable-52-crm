import {
  addDays,
  diffDays,
  startOfMonth,
  startOfWeek,
  todayIso,
  weekdayIndex,
} from "@/lib/dates";
import type { DashboardData, SalesStat } from "@/types/dashboard";

// DATA TIRUAN untuk membangun tampilan dashboard sebelum backend ada.
// Bentuknya sama dengan DashboardData, jadi nanti cukup diganti sumbernya.

const SALES = [
  { id: "rina", name: "Rina Wulandari", share: 0.34, leadsPerDay: 3.2, winRate: 0.42 },
  { id: "dimas", name: "Dimas Prasetyo", share: 0.22, leadsPerDay: 2.8, winRate: 0.33 },
  { id: "sari", name: "Sari Kusuma", share: 0.17, leadsPerDay: 2.4, winRate: 0.31 },
  { id: "bayu", name: "Bayu Saputra", share: 0.14, leadsPerDay: 2, winRate: 0.29 },
  { id: "maya", name: "Maya Lestari", share: 0.09, leadsPerDay: 1.8, winRate: 0.18 },
  { id: "fajar", name: "Fajar Nugroho", share: 0.04, leadsPerDay: 1.3, winRate: 0.13 },
];

// Senin sampai Minggu: akhir pekan lebih sepi.
const WEEKDAY_TOTAL = [
  12_800_000, 13_600_000, 15_100_000, 14_200_000, 17_500_000, 9_400_000,
  4_100_000,
];

const TODAY_TRANSACTIONS = [
  { time: "16:10", salesId: "sari", product: "Perpanjangan langganan", amount: 950_000 },
  { time: "15:40", salesId: "rina", product: "Paket Bisnis", amount: 2_750_000 },
  { time: "14:05", salesId: "dimas", product: "Perpanjangan langganan", amount: 950_000 },
  { time: "13:20", salesId: "maya", product: "Paket Starter", amount: 1_200_000 },
  { time: "11:05", salesId: "bayu", product: "Paket Bisnis", amount: 2_750_000 },
  { time: "10:30", salesId: "rina", product: "Layanan instalasi", amount: 1_500_000 },
  { time: "09:55", salesId: "sari", product: "Paket Starter", amount: 1_200_000 },
  { time: "09:10", salesId: "dimas", product: "Paket Bisnis", amount: 2_750_000 },
  { time: "08:42", salesId: "rina", product: "Paket Premium 12 bulan", amount: 4_800_000 },
];

const TODAY_LEADS: Record<string, { leads: number; won: number }> = {
  rina: { leads: 4, won: 2 },
  dimas: { leads: 3, won: 1 },
  sari: { leads: 2, won: 1 },
  bayu: { leads: 2, won: 1 },
  maya: { leads: 2, won: 0 },
  fajar: { leads: 1, won: 0 },
};

const round = (value: number, step: number) => Math.round(value / step) * step;

function dayTotal(date: string, today: string) {
  if (date === today)
    return TODAY_TRANSACTIONS.reduce((sum, item) => sum + item.amount, 0);
  // Hari yang lebih lama sedikit lebih kecil, supaya trennya naik pelan.
  const age = diffDays(date, today);
  return round(WEEKDAY_TOTAL[weekdayIndex(date)] * (1 - 0.004 * age), 50_000);
}

function statsBetween(from: string, to: string, today: string): SalesStat[] {
  const days = diffDays(from, to) + 1;
  return SALES.map((member) => {
    let amount = 0;
    let count = 0;
    let leads = 0;
    let won = 0;
    for (let index = 0; index < days; index += 1) {
      const date = addDays(from, index);
      if (date === today) {
        const own = TODAY_TRANSACTIONS.filter(
          (item) => item.salesId === member.id,
        );
        amount += own.reduce((sum, item) => sum + item.amount, 0);
        count += own.length;
        leads += TODAY_LEADS[member.id].leads;
        won += TODAY_LEADS[member.id].won;
      } else {
        const share = round(dayTotal(date, today) * member.share, 50_000);
        amount += share;
        count += Math.round(share / 1_350_000);
        const dayLeads = Math.round(member.leadsPerDay);
        leads += dayLeads;
        won += Math.round(dayLeads * member.winRate);
      }
    }
    return { salesId: member.id, name: member.name, amount, count, leads, won };
  });
}

export function getMockDashboard(): DashboardData {
  const today = todayIso();
  const yesterday = addDays(today, -1);
  const weekStart = startOfWeek(today);
  const monthStats = statsBetween(startOfMonth(today), today, today);
  const todayStats = statsBetween(today, today, today);
  const yesterdayStats = statsBetween(yesterday, yesterday, today);
  const sum = (rows: SalesStat[], key: "amount" | "count" | "leads" | "won") =>
    rows.reduce((total, row) => total + row[key], 0);

  return {
    today,
    salesMembers: SALES.map(({ id, name }) => ({ id, name })),
    summary: {
      today: {
        amount: sum(todayStats, "amount"),
        count: sum(todayStats, "count"),
        leads: sum(todayStats, "leads"),
      },
      yesterday: {
        amount: sum(yesterdayStats, "amount"),
        count: sum(yesterdayStats, "count"),
        leads: sum(yesterdayStats, "leads"),
      },
      monthLeads: { total: sum(monthStats, "leads"), won: sum(monthStats, "won") },
    },
    comparison: {
      today: todayStats,
      week: statsBetween(weekStart, today, today),
      month: monthStats,
    },
    week: Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, index);
      return {
        date,
        current: date <= today ? dayTotal(date, today) : null,
        previous: dayTotal(addDays(date, -7), today),
      };
    }),
    daily: Array.from({ length: 30 }, (_, index) => {
      const date = addDays(today, index - 29);
      return { date, amount: dayTotal(date, today) };
    }),
    transactions: TODAY_TRANSACTIONS.map((item, index) => ({
      id: `mock-${TODAY_TRANSACTIONS.length - index}`,
      createdAt: `${today}T${item.time}:00+07:00`,
      salesId: item.salesId,
      salesName: SALES.find((member) => member.id === item.salesId)!.name,
      product: item.product,
      amount: item.amount,
    })),
  };
}
