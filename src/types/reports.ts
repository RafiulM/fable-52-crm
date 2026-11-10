export type ReportPeriod = "today" | "week" | "month" | "custom";

export type DateRange = { from: string; to: string };

export type ReportTotals = {
  amount: number;
  count: number;
  leads: number;
  won: number;
};

// Rekap satu sales pada periode laporan, berdampingan dengan periode pembanding.
export type ReportRow = ReportTotals & {
  salesId: string;
  name: string;
  previous: ReportTotals;
};

export type Report = {
  period: ReportPeriod;
  current: DateRange;
  // Periode pembanding: rentang dengan panjang sama tepat sebelumnya, atau
  // rentang yang sama pada minggu/bulan lalu.
  previous: DateRange;
  rows: ReportRow[];
  totals: { current: ReportTotals; previous: ReportTotals };
};
