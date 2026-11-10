// Format angka untuk tampilan Indonesia. Aman dipakai di server maupun browser.

export function rupiah(value: number) {
  return "Rp " + Math.round(value).toLocaleString("id-ID");
}

export function persen(value: number) {
  return (
    value.toLocaleString("id-ID", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + "%"
  );
}

// Label sumbu grafik: 12500000 -> "12,5 jt"
export function juta(value: number) {
  return (
    (value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 }) +
    " jt"
  );
}

// Input nominal: simpan hanya angka, tampilkan dengan titik ribuan.
export function onlyDigits(text: string) {
  return text.replace(/\D/g, "").slice(0, 12);
}

export function formatDigits(text: string) {
  const digits = onlyDigits(text);
  return digits ? Number(digits).toLocaleString("id-ID") : "";
}

// Persentase yang aman untuk pembagi nol.
export function ratio(part: number, whole: number) {
  return whole > 0 ? (part / whole) * 100 : 0;
}
