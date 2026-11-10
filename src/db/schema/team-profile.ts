import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { user } from "./user";

// Informasi tim milik satu akun pemilik. Dipisah dari tabel `user` supaya
// tabel inti Better Auth tidak diubah.
export const teamProfiles = pgTable("team_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  teamName: varchar("team_name", { length: 120 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
