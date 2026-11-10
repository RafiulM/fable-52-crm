import { z } from "zod";

export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Isi nama pengguna.")
      .max(100, "Nama terlalu panjang.")
      .optional(),
    teamName: z
      .string()
      .trim()
      .min(1, "Isi nama tim.")
      .max(120, "Nama tim terlalu panjang.")
      .optional(),
  })
  .strict()
  .refine(
    (value) => value.name !== undefined || value.teamName !== undefined,
    "Sertakan nama pengguna atau nama tim yang diubah.",
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
