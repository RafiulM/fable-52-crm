import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./user";

// Anggota tim sales milik satu akun pemilik. Anggota yang keluar dinonaktifkan
// (is_active = false), bukan dihapus, supaya riwayat penjualannya tetap ada.
export const salesMembers = pgTable(
  "sales_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 40 }).default("").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("sales_members_user_active_name_idx").on(
      table.userId,
      table.isActive,
      table.name,
    ),
  ],
);
