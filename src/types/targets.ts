export type TargetMode = "daily" | "monthly";

// Periode target: satu tanggal ("YYYY-MM-DD") atau satu bulan ("YYYY-MM").
export type TargetPeriod =
  | { mode: "daily"; date: string }
  | { mode: "monthly"; month: string };

// Target dan pencapaian satu sales pada periode itu. `target` 0 berarti belum
// ada target.
export type TargetRow = {
  salesId: string;
  name: string;
  target: number;
  achieved: number;
};
