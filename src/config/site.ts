import starter from "../../starter.config.json";

// Change these values to give every page your app's name and description.
export const siteConfig = {
  id: starter.id,
  name: starter.name,
  description: starter.description,
  homePath: "/dashboard",
  // Semua "hari ini", "minggu ini", dan "bulan ini" dihitung di zona waktu ini.
  timeZone: "Asia/Jakarta",
} as const;
