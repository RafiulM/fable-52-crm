import { addDays, todayIso } from "@/lib/dates";
import type { SalesMemberOption } from "@/types/dashboard";
import type { TransactionItem } from "@/types/transactions";

// DATA TIRUAN halaman Catat Penjualan, dipakai sampai API riwayat transaksi ada.

export const MOCK_SALES_MEMBERS: SalesMemberOption[] = [
  { id: "rina", name: "Rina Wulandari" },
  { id: "dimas", name: "Dimas Prasetyo" },
  { id: "sari", name: "Sari Kusuma" },
  { id: "bayu", name: "Bayu Saputra" },
  { id: "maya", name: "Maya Lestari" },
  { id: "fajar", name: "Fajar Nugroho" },
];

// [selisih hari dari hari ini, jam, sales, produk, nominal]
const ROWS: [number, string, string, string, number][] = [
  [0, "16:10", "sari", "Perpanjangan langganan", 950_000],
  [0, "15:40", "rina", "Paket Bisnis", 2_750_000],
  [0, "14:05", "dimas", "Perpanjangan langganan", 950_000],
  [0, "13:20", "maya", "Paket Starter", 1_200_000],
  [0, "11:05", "bayu", "Paket Bisnis", 2_750_000],
  [0, "10:30", "rina", "Layanan instalasi", 1_500_000],
  [0, "09:55", "sari", "Paket Starter", 1_200_000],
  [0, "09:10", "dimas", "Paket Bisnis", 2_750_000],
  [0, "08:42", "rina", "Paket Premium 12 bulan", 4_800_000],
  [-1, "16:30", "dimas", "Paket Starter dan pelatihan", 1_250_000],
  [-1, "15:05", "maya", "Layanan instalasi", 1_500_000],
  [-1, "14:25", "bayu", "Paket Starter", 1_200_000],
  [-1, "13:10", "rina", "Perpanjangan langganan", 950_000],
  [-1, "11:30", "fajar", "Paket Starter", 1_200_000],
  [-1, "10:15", "sari", "Paket Bisnis", 2_750_000],
  [-1, "09:40", "dimas", "Paket Bisnis", 2_750_000],
  [-1, "09:05", "rina", "Paket Premium 12 bulan", 4_800_000],
];

export function getMockTransactions(): TransactionItem[] {
  const today = todayIso();
  return ROWS.map(([offset, time, salesId, product, amount], index) => {
    const date = addDays(today, offset);
    return {
      id: `mock-${ROWS.length - index}`,
      salesMemberId: salesId,
      salesName: MOCK_SALES_MEMBERS.find((member) => member.id === salesId)!.name,
      amount,
      productDescription: product,
      transactionDate: date,
      createdAt: `${date}T${time}:00+07:00`,
    };
  });
}
