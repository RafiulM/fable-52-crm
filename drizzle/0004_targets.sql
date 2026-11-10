CREATE TABLE "daily_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"sales_member_id" uuid NOT NULL,
	"date" date NOT NULL,
	"amount" bigint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_targets_amount_positive" CHECK ("daily_targets"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "monthly_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"sales_member_id" uuid NOT NULL,
	"month" varchar(7) NOT NULL,
	"amount" bigint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "monthly_targets_amount_positive" CHECK ("monthly_targets"."amount" > 0),
	CONSTRAINT "monthly_targets_month_format" CHECK ("monthly_targets"."month" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);
--> statement-breakpoint
ALTER TABLE "daily_targets" ADD CONSTRAINT "daily_targets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_targets" ADD CONSTRAINT "daily_targets_sales_member_id_sales_members_id_fk" FOREIGN KEY ("sales_member_id") REFERENCES "public"."sales_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_targets" ADD CONSTRAINT "monthly_targets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_targets" ADD CONSTRAINT "monthly_targets_sales_member_id_sales_members_id_fk" FOREIGN KEY ("sales_member_id") REFERENCES "public"."sales_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_targets_member_date_idx" ON "daily_targets" USING btree ("sales_member_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "monthly_targets_member_month_idx" ON "monthly_targets" USING btree ("sales_member_id","month");