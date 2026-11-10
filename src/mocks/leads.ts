import { addDays, todayIso } from "@/lib/dates";
import type { LeadStatus } from "@/lib/lead-status";
import { MOCK_SALES_MEMBERS } from "@/mocks/transactions";
import type { LeadItem } from "@/types/leads";

// DATA TIRUAN halaman Leads & Kontak, dipakai sampai API leads ada.
// [nama, kontak, sales, status, catatan, selisih hari dari hari ini]
const ROWS: [string, string, string, LeadStatus, string, number][] = [
  [
    "Budi Santoso",
    "0812-5550-0101",
    "rina",
    "jadi_beli",
    "Ambil Paket Premium 12 bulan.",
    0,
  ],
  [
    "Toko Sumber Rejeki",
    "0812-5550-0102",
    "rina",
    "jadi_beli",
    "Paket Bisnis untuk 3 kasir.",
    0,
  ],
  [
    "Dewi Anggraini",
    "0812-5550-0103",
    "rina",
    "dihubungi",
    "Minta penawaran tertulis.",
    0,
  ],
  [
    "Hendra Gunawan",
    "@hendra.gunawan",
    "rina",
    "baru",
    "Masuk dari Instagram.",
    0,
  ],
  [
    "CV Maju Bersama",
    "0812-5550-0105",
    "rina",
    "gagal",
    "Anggaran belum ada tahun ini.",
    -2,
  ],
  [
    "Siti Rahmawati",
    "0812-5550-0106",
    "dimas",
    "jadi_beli",
    "Paket Bisnis, bayar transfer.",
    0,
  ],
  [
    "Agus Setiawan",
    "0812-5550-0107",
    "dimas",
    "dihubungi",
    "Jadwal demo Jumat pagi.",
    -1,
  ],
  ["Lina Marlina", "0812-5550-0108", "dimas", "baru", "", 0],
  [
    "Bengkel Jaya Motor",
    "0812-5550-0109",
    "dimas",
    "dihubungi",
    "Bandingkan dengan vendor lain.",
    -1,
  ],
  [
    "Yulia Pratiwi",
    "0812-5550-0110",
    "sari",
    "jadi_beli",
    "Perpanjangan langganan.",
    0,
  ],
  [
    "Rudi Hartono",
    "0812-5550-0111",
    "sari",
    "dihubungi",
    "Telepon ulang hari Senin.",
    -1,
  ],
  ["Kopi Senja", "@kopisenja", "sari", "baru", "Tanya harga Paket Starter.", 0],
  [
    "Tono Wibowo",
    "0812-5550-0113",
    "sari",
    "gagal",
    "Tidak merespons 3 kali.",
    -3,
  ],
  ["Indah Permata", "0812-5550-0114", "bayu", "jadi_beli", "Paket Bisnis.", 0],
  ["Eko Purnomo", "0812-5550-0115", "bayu", "baru", "", 0],
  [
    "Apotek Sehat Selalu",
    "0812-5550-0116",
    "bayu",
    "dihubungi",
    "Menunggu persetujuan pemilik.",
    -1,
  ],
  [
    "Fitri Handayani",
    "0812-5550-0117",
    "maya",
    "dihubungi",
    "Kirim brosur lewat WhatsApp.",
    0,
  ],
  ["Joko Susilo", "0812-5550-0118", "maya", "baru", "", 0],
  [
    "Salon Cantika",
    "0812-5550-0119",
    "maya",
    "gagal",
    "Sudah pakai produk lain.",
    -2,
  ],
  [
    "Wawan Kurniawan",
    "0812-5550-0120",
    "fajar",
    "baru",
    "Referensi dari pelanggan lama.",
    0,
  ],
  ["Nina Oktaviani", "0812-5550-0121", "fajar", "dihubungi", "", -1],
  [
    "Warung Bu Tini",
    "0812-5550-0122",
    "fajar",
    "jadi_beli",
    "Paket Starter.",
    -1,
  ],
];

export function getMockLeads(): LeadItem[] {
  const today = todayIso();
  return ROWS.map(([name, contact, salesId, status, notes, offset], index) => {
    const date = addDays(today, offset);
    return {
      id: `mock-${index + 1}`,
      salesMemberId: salesId,
      salesName: MOCK_SALES_MEMBERS.find((member) => member.id === salesId)!
        .name,
      name,
      contact,
      status,
      notes,
      leadDate: date,
      updatedAt: `${date}T${String(9 + (index % 8)).padStart(2, "0")}:15:00+07:00`,
    };
  });
}
