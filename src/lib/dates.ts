import { siteConfig } from "@/config/site";

// Tanggal bisnis disimpan sebagai teks "YYYY-MM-DD" tanpa jam, supaya
// "hari ini" tidak bergeser karena zona waktu server atau browser.

export function todayIso(now: Date = new Date()) {
  // Locale en-CA menghasilkan format YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: siteConfig.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function toUtc(iso: string) {
  return new Date(iso + "T00:00:00Z");
}

export function addDays(iso: string, days: number) {
  const date = toUtc(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function diffDays(from: string, to: string) {
  return Math.round((toUtc(to).getTime() - toUtc(from).getTime()) / 86_400_000);
}

// 0 = Senin ... 6 = Minggu
export function weekdayIndex(iso: string) {
  return (toUtc(iso).getUTCDay() + 6) % 7;
}

export function startOfWeek(iso: string) {
  return addDays(iso, -weekdayIndex(iso));
}

export function startOfMonth(iso: string) {
  return iso.slice(0, 8) + "01";
}

// "2026-11" untuk tanggal mana pun di bulan itu.
export function monthKey(iso: string) {
  return iso.slice(0, 7);
}

export function addMonths(iso: string, months: number) {
  const date = toUtc(startOfMonth(iso));
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

function format(iso: string, options: Intl.DateTimeFormatOptions) {
  return toUtc(iso).toLocaleDateString("id-ID", {
    timeZone: "UTC",
    ...options,
  });
}

// "Kamis, 12 November 2026"
export function formatLongDate(iso: string) {
  return format(iso, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// "Kamis, 12 November"
export function formatDayDate(iso: string) {
  return format(iso, { weekday: "long", day: "numeric", month: "long" });
}

// "12 Nov 2026"
export function formatDate(iso: string) {
  return format(iso, { day: "numeric", month: "short", year: "numeric" });
}

// "12 Nov"
export function formatShortDate(iso: string) {
  return format(iso, { day: "numeric", month: "short" });
}

// "November 2026"
export function formatMonth(iso: string) {
  return format(iso, { month: "long", year: "numeric" });
}

export function weekdayName(iso: string, length: "long" | "short" = "long") {
  return format(iso, { weekday: length });
}

// Jam lokal dari cap waktu pencatatan, mis. "16.10".
export function formatTime(value: string | Date) {
  return new Date(value).toLocaleTimeString("id-ID", {
    timeZone: siteConfig.timeZone,
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Rentang tanggal (inklusif) untuk periode berjalan sampai hari ini.
export function periodRange(period: "today" | "week" | "month", today: string) {
  const from =
    period === "week"
      ? startOfWeek(today)
      : period === "month"
        ? startOfMonth(today)
        : today;
  return { from, to: today };
}

// "Hari ini", "Kemarin", atau tanggal biasa ("8 Nov 2026") untuk yang lebih lama.
export function formatRelativeDate(iso: string, today: string) {
  if (iso === today) return "Hari ini";
  if (iso === addDays(today, -1)) return "Kemarin";
  return formatDate(iso);
}
