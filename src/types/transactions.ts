// Satu transaksi seperti yang dikirim API ke browser.
export type TransactionItem = {
  id: string;
  salesMemberId: string;
  salesName: string;
  amount: number;
  productDescription: string;
  // Tanggal bisnis "YYYY-MM-DD".
  transactionDate: string;
  // Cap waktu pencatatan (ISO).
  createdAt: string;
};

export type TransactionInput = {
  salesMemberId: string;
  amount: number;
  productDescription: string;
  transactionDate: string;
};

// Ringkasan daftar sesuai filter, dihitung server atas semua baris yang cocok.
export type TransactionListMeta = {
  limit: number;
  offset: number;
  hasMore: boolean;
  total: number;
  totalAmount: number;
};
