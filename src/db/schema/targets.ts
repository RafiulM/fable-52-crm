import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  date,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { salesMembers } from "./sales-members";
import { user } from "./user";

// Target penjualan satu sales untuk satu tanggal. Paling banyak satu baris per
// sales per tanggal; menyimpan ulang menimpa nominalnya.
export const dailyTargets = pgTable(
  "daily_targets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    salesMemberId: uuid("sales_member_id")
      .notNull()
      .references(() => salesMembers.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("daily_targets_member_date_idx").on(
      table.salesMemberId,
      table.date,
    ),
    check("daily_targets_amount_positive", sql`${table.amount} > 0`),
  ],
);

// Target penjualan satu sales untuk satu bulan, `month` berformat "YYYY-MM".
export const monthlyTargets = pgTable(
  "monthly_targets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    salesMemberId: uuid("sales_member_id")
      .notNull()
      .references(() => salesMembers.id, { onDelete: "cascade" }),
    month: varchar("month", { length: 7 }).notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("monthly_targets_member_month_idx").on(
      table.salesMemberId,
      table.month,
    ),
    check("monthly_targets_amount_positive", sql`${table.amount} > 0`),
    check(
      "monthly_targets_month_format",
      sql`${table.month} ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'`,
    ),
  ],
);
