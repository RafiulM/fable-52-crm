// Status lead dipakai bersama oleh skema database, validasi, dan tampilan.
// Aman diimpor dari browser: tidak ada kode khusus server di sini.
export const LEAD_STATUSES = ["baru", "dihubungi", "jadi_beli", "gagal"] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  baru: "Baru",
  dihubungi: "Dihubungi",
  jadi_beli: "Jadi beli",
  gagal: "Gagal",
};

// Lead dihitung sebagai konversi saat statusnya "jadi_beli".
export const WON_STATUS: LeadStatus = "jadi_beli";
