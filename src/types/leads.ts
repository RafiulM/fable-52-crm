import type { LeadStatus } from "@/lib/lead-status";

// Satu lead seperti yang dikirim API ke browser.
export type LeadItem = {
  id: string;
  salesMemberId: string;
  salesName: string;
  name: string;
  contact: string;
  status: LeadStatus;
  notes: string;
  // Tanggal bisnis lead masuk, "YYYY-MM-DD".
  leadDate: string;
  // Cap waktu perubahan terakhir (ISO).
  updatedAt: string;
};

export type LeadInput = {
  salesMemberId: string;
  name: string;
  contact: string;
  status: LeadStatus;
  notes: string;
};
