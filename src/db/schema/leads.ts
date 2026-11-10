import {
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { LEAD_STATUSES } from "../../lib/lead-status";
import { salesMembers } from "./sales-members";
import { user } from "./user";

export const leadStatus = pgEnum("lead_status", LEAD_STATUSES);

// Calon pembeli yang ditangani satu sales. `lead_date` adalah tanggal bisnis
// lead masuk; konversi dihitung dari lead berstatus "jadi_beli".
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    salesMemberId: uuid("sales_member_id")
      .notNull()
      .references(() => salesMembers.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 160 }).notNull(),
    contact: varchar("contact", { length: 160 }).default("").notNull(),
    status: leadStatus("status").default("baru").notNull(),
    notes: text("notes").default("").notNull(),
    leadDate: date("lead_date", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("leads_user_date_idx").on(
      table.userId,
      table.leadDate.desc(),
      table.createdAt.desc(),
    ),
    index("leads_member_status_idx").on(table.salesMemberId, table.status),
  ],
);
