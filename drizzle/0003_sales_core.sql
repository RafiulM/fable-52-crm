CREATE TYPE "public"."lead_status" AS ENUM('baru', 'dihubungi', 'jadi_beli', 'gagal');--> statement-breakpoint
CREATE TABLE "sales_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(120) NOT NULL,
	"phone" varchar(40) DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"sales_member_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"product_description" varchar(200) DEFAULT '' NOT NULL,
	"transaction_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_amount_positive" CHECK ("transactions"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"sales_member_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"contact" varchar(160) DEFAULT '' NOT NULL,
	"status" "lead_status" DEFAULT 'baru' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"lead_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sales_members" ADD CONSTRAINT "sales_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_sales_member_id_sales_members_id_fk" FOREIGN KEY ("sales_member_id") REFERENCES "public"."sales_members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_sales_member_id_sales_members_id_fk" FOREIGN KEY ("sales_member_id") REFERENCES "public"."sales_members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sales_members_user_active_name_idx" ON "sales_members" USING btree ("user_id","is_active","name");--> statement-breakpoint
CREATE INDEX "transactions_user_date_idx" ON "transactions" USING btree ("user_id","transaction_date" DESC NULLS LAST,"created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "transactions_member_date_idx" ON "transactions" USING btree ("sales_member_id","transaction_date");--> statement-breakpoint
CREATE INDEX "leads_user_date_idx" ON "leads" USING btree ("user_id","lead_date" DESC NULLS LAST,"created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "leads_member_status_idx" ON "leads" USING btree ("sales_member_id","status");