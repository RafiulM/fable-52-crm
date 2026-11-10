import "server-only";
import {
  addDays,
  addMonths,
  diffDays,
  startOfMonth,
  startOfWeek,
} from "@/lib/dates";
import { getSalesComparison } from "@/services/dashboard.service";
import type {
  DateRange,
  Report,
  ReportPeriod,
  ReportTotals,
} from "@/types/reports";

const EMPTY: ReportTotals = { amount: 0, count: 0, leads: 0, won: 0 };

// Menentukan rentang laporan dan rentang pembandingnya.
// - today: hari ini vs kemarin
// - week: Senin–hari ini vs hari yang sama minggu lalu
// - month: tanggal 1–hari ini vs tanggal yang sama bulan lalu
// - custom: rentang pilihan vs rentang sama panjang tepat sebelumnya
export function resolveReportRanges(
  period: ReportPeriod,
  today: string,
  custom?: DateRange,
): { current: DateRange; previous: DateRange } {
  if (period === "custom" && custom) {
    const length = diffDays(custom.from, custom.to) + 1;
    return {
      current: custom,
      previous: {
        from: addDays(custom.from, -length),
        to: addDays(custom.from, -1),
      },
    };
  }
  if (period === "week") {
    const from = startOfWeek(today);
    return {
      current: { from, to: today },
      previous: { from: addDays(from, -7), to: addDays(today, -7) },
    };
  }
  if (period === "month") {
    const from = startOfMonth(today);
    const previousFrom = addMonths(from, -1);
    // Bulan lalu bisa lebih pendek (mis. 31 Maret vs Februari): berhenti di
    // hari terakhir bulan lalu.
    const sameDay = addDays(previousFrom, diffDays(from, today));
    const previousEnd = addDays(from, -1);
    return {
      current: { from, to: today },
      previous: {
        from: previousFrom,
        to: sameDay < previousEnd ? sameDay : previousEnd,
      },
    };
  }
  const yesterday = addDays(today, -1);
  return {
    current: { from: today, to: today },
    previous: { from: yesterday, to: yesterday },
  };
}

function sum(rows: ReportTotals[]): ReportTotals {
  return rows.reduce<ReportTotals>(
    (total, row) => ({
      amount: total.amount + row.amount,
      count: total.count + row.count,
      leads: total.leads + row.leads,
      won: total.won + row.won,
    }),
    EMPTY,
  );
}

// Rekap per sales untuk periode laporan dan periode pembandingnya. Angka
// dijumlahkan di database oleh getSalesComparison; di sini hanya digabung.
export async function getReport(
  userId: string,
  period: ReportPeriod,
  today: string,
  custom?: DateRange,
): Promise<Report> {
  const { current, previous } = resolveReportRanges(period, today, custom);
  const [currentRows, previousRows] = await Promise.all([
    getSalesComparison(userId, current.from, current.to),
    getSalesComparison(userId, previous.from, previous.to),
  ]);

  // Sales yang hanya punya data di periode pembanding tetap ikut, supaya
  // total kedua periode cocok dengan jumlah barisnya.
  const names = new Map<string, string>();
  for (const row of [...currentRows, ...previousRows])
    names.set(row.salesId, row.name);
  const byId = (rows: typeof currentRows) =>
    new Map(rows.map((row) => [row.salesId, row]));
  const now = byId(currentRows);
  const before = byId(previousRows);

  const rows = [...names]
    .map(([salesId, name]) => {
      const { amount, count, leads, won } = now.get(salesId) ?? EMPTY;
      const prior = before.get(salesId) ?? EMPTY;
      return {
        salesId,
        name,
        amount,
        count,
        leads,
        won,
        previous: {
          amount: prior.amount,
          count: prior.count,
          leads: prior.leads,
          won: prior.won,
        },
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    period,
    current,
    previous,
    rows,
    totals: {
      current: sum(rows),
      previous: sum(rows.map((row) => row.previous)),
    },
  };
}
