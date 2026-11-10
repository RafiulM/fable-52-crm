import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  date,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { salesMembers } from "./sales-members";
import { user } from "./user";

// Satu catatan penjualan. `amount` dalam Rupiah bulat. `transaction_date`
// adalah tanggal bisnis tanpa jam, jadi "hari ini" tidak tergantung zona waktu.
export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // restrict: anggota yang punya transaksi tidak bisa dihapus, hanya dinonaktifkan.
    salesMemberId: uuid("sales_member_id")
      .notNull()
      .references(() => salesMembers.id, { onDelete: "restrict" }),
    amount: bigint("amount", { mode: "number" }).notNull(),
    productDescription: varchar("product_description", { length: 200 })
      .default("")
      .notNull(),
    transactionDate: date("transaction_date", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("transactions_user_date_idx").on(
      table.userId,
      table.transactionDate.desc(),
      table.createdAt.desc(),
    ),
    index("transactions_member_date_idx").on(
      table.salesMemberId,
      table.transactionDate,
    ),
    check("transactions_amount_positive", sql`${table.amount} > 0`),
  ],
);
