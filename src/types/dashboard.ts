// Bentuk data halaman dashboard. Halaman dan komponen hanya bergantung pada
// tipe ini, sehingga sumber datanya bisa diganti tanpa mengubah tampilan.

export type DashboardPeriod = "today" | "week" | "month";

export type SalesMemberOption = { id: string; name: string };

export type SalesStat = {
  salesId: string;
  name: string;
  amount: number;
  count: number;
  leads: number;
  won: number;
};

export type DashboardTransaction = {
  id: string;
  // Cap waktu pencatatan (ISO), ditampilkan sebagai jam lokal.
  createdAt: string;
  salesId: string;
  salesName: string;
  product: string;
  amount: number;
};

export type DashboardData = {
  // Tanggal bisnis hari ini, "YYYY-MM-DD".
  today: string;
  // Sales aktif, untuk form catat penjualan.
  salesMembers: SalesMemberOption[];
  summary: {
    today: { amount: number; count: number; leads: number };
    yesterday: { amount: number; count: number; leads: number };
    monthLeads: { total: number; won: number };
  };
  comparison: Record<DashboardPeriod, SalesStat[]>;
  // Senin sampai Minggu. `current` null berarti harinya belum terjadi.
  week: { date: string; current: number | null; previous: number }[];
  // 30 hari terakhir termasuk hari ini, urut dari yang paling lama.
  daily: { date: string; amount: number }[];
  // Transaksi hari ini, terbaru dulu.
  transactions: DashboardTransaction[];
};
