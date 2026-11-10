import { z } from "zod";

const name = z
  .string()
  .trim()
  .min(1, "Isi nama anggota.")
  .max(120, "Nama terlalu panjang.");
// Nomor telepon atau WhatsApp. Boleh kosong; kalau diisi minimal 8 angka.
const phone = z
  .string()
  .trim()
  .max(40, "Nomor terlalu panjang.")
  .refine(
    (value) => value === "" || value.replace(/\D/g, "").length >= 8,
    "Isi nomor telepon atau WhatsApp, minimal 8 angka.",
  );

export const createSalesMemberSchema = z
  .object({ name, phone: phone.default("") })
  .strict();

export const updateSalesMemberSchema = z
  .object({
    name: name.optional(),
    phone: phone.optional(),
    // false menonaktifkan anggota; true mengaktifkannya kembali.
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine(
    (value) => Object.values(value).some((field) => field !== undefined),
    "Sertakan minimal satu isian yang diubah.",
  );

export const salesMemberIdSchema = z.string().uuid();

export type CreateSalesMemberInput = z.infer<typeof createSalesMemberSchema>;
export type UpdateSalesMemberInput = z.infer<typeof updateSalesMemberSchema>;
