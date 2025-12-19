CREATE TABLE "digital_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid,
	"variant_id" uuid,
	"url" text NOT NULL,
	"url_high_res" text,
	"type" varchar(50) NOT NULL,
	"subtype" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" varchar(100),
	"sku" varchar(100),
	"release_date" timestamp with time zone,
	"discontinued_date" timestamp with time zone,
	"product_proposition_category" varchar(50),
	"category_level1" varchar(255),
	"category_level2" varchar(255),
	"category_level3" varchar(255),
	"color_description" varchar(255),
	"color_group" varchar(100),
	"plc_status" varchar(10),
	"plc_status_description" varchar(100),
	"gtin" varchar(50),
	"color_code" varchar(20),
	"pms_color" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "master_code" varchar(100);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "master_id" varchar(100);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "type_of_products" varchar(50);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "commodity_code" varchar(50);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "number_of_print_positions" varchar(10);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "product_name" varchar(255);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "category_code" varchar(100);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "product_class" varchar(255);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "length_unit" varchar(10);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "width_unit" varchar(10);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "height_unit" varchar(10);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "volume" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "volume_unit" varchar(10);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "gross_weight" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "gross_weight_unit" varchar(10);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "net_weight" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "net_weight_unit" varchar(10);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "inner_carton_quantity" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "outer_carton_quantity" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "carton_length" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "carton_length_unit" varchar(10);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "carton_width" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "carton_width_unit" varchar(10);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "carton_height" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "carton_height_unit" varchar(10);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "carton_volume" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "carton_volume_unit" varchar(10);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "carton_gross_weight" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "carton_gross_weight_unit" varchar(10);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "short_description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "long_description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "packaging_after_printing" varchar(255);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "printable" varchar(10);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "timestamp" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "digital_assets" ADD CONSTRAINT "digital_assets_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_assets" ADD CONSTRAINT "digital_assets_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;