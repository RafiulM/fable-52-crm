// Satu anggota tim sales seperti yang dikirim API ke browser.
export type SalesMemberItem = {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  // Cap waktu pendaftaran (ISO).
  createdAt: string;
};
