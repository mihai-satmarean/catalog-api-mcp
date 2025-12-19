CREATE TABLE "free_day_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"reason" text,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_provider_id" uuid,
	"item_code" varchar(100) NOT NULL,
	"currency" varchar(10),
	"price_tier1_qty" integer,
	"price_tier1_price" numeric(10, 2),
	"price_tier2_qty" integer,
	"price_tier2_price" numeric(10, 2),
	"price_tier3_qty" integer,
	"price_tier3_price" numeric(10, 2),
	"price_tier4_qty" integer,
	"price_tier4_price" numeric(10, 2),
	"price_tier5_qty" integer,
	"price_tier5_price" numeric(10, 2),
	"unit_price" numeric(10, 2),
	"minimum_order_quantity" integer,
	"effective_date" timestamp with time zone,
	"expiry_date" timestamp with time zone,
	"raw_data" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feed_created_date_time" timestamp with time zone,
	"item_data_last_modified_date_time" timestamp with time zone,
	"model_code" varchar(100),
	"item_code" varchar(100) NOT NULL,
	"product_life_cycle" varchar(50),
	"intro_date" timestamp with time zone,
	"item_name" varchar(500),
	"long_description" text,
	"brand" varchar(255),
	"main_category" varchar(255),
	"sub_category" varchar(255),
	"material" varchar(500),
	"color" varchar(100),
	"pms_color1" varchar(100),
	"hex_color1" varchar(10),
	"item_length_cm" numeric(10, 2),
	"item_width_cm" numeric(10, 2),
	"item_height_cm" numeric(10, 2),
	"item_dimensions" varchar(100),
	"item_weight_net_gr" numeric(10, 2),
	"item_weight_gross_gr" numeric(10, 2),
	"country_of_origin" varchar(10),
	"commodity_code" varchar(50),
	"ean_code" varchar(50),
	"packaging_type_item" varchar(100),
	"outer_carton_length_cm" numeric(10, 2),
	"outer_carton_width_cm" numeric(10, 2),
	"outer_carton_height_cm" numeric(10, 2),
	"outer_carton_dimensions" varchar(100),
	"outer_carton_weight_net_kg" numeric(10, 2),
	"outer_carton_weight_gross_kg" numeric(10, 2),
	"innerbox_qty" integer,
	"outer_carton_qty" integer,
	"compliance" text,
	"certifications" text,
	"social_audits" varchar(255),
	"eco" boolean,
	"traceability" varchar(255),
	"charity" varchar(255),
	"pvc_free" boolean,
	"digital_passport" text,
	"leak_prevention" varchar(255),
	"total_co2_emissions" numeric(10, 2),
	"total_co2_emissions_benchmark" numeric(10, 2),
	"lca_total_co2_kg_emissions" numeric(10, 2),
	"lca_total_co2_kg_emissions_benchmark" numeric(10, 2),
	"lca_co2_gr_material_and_production" numeric(10, 2),
	"lca_co2_gr_packaging" numeric(10, 2),
	"lca_co2_gr_transport" numeric(10, 2),
	"lca_co2_gr_eol" numeric(10, 2),
	"lca_co2_percent_material_and_production" numeric(10, 2),
	"lca_co2_percent_packaging" numeric(10, 2),
	"lca_co2_percent_transport" numeric(10, 2),
	"lca_co2_percent_eol" numeric(10, 2),
	"all_images" text,
	"main_image" text,
	"main_image_neutral" text,
	"extra_image1" text,
	"extra_image2" text,
	"extra_image3" text,
	"image_print" text,
	"all_print_codes" varchar(500),
	"print_code_default" varchar(255),
	"print_technique_default" varchar(255),
	"print_position_default" varchar(255),
	"max_print_width_default_mm" integer,
	"max_print_height_default_mm" integer,
	"max_print_area_default" varchar(100),
	"max_colors_default" integer,
	"line_drawing_default" text,
	"variable_data_printing" boolean,
	"custom_sleeve_possible" boolean,
	"gift_wrapping_possible" boolean,
	"usp" text,
	"gpsr_contact" varchar(255),
	"gpsr_website" text,
	"imagefile_3d" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_providers_item_code_unique" UNIQUE("item_code")
);
--> statement-breakpoint
CREATE TABLE "product_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"personalization_remarks" text,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price" numeric(10, 2),
	"source" varchar(50),
	"brand" varchar(255),
	"product_code" varchar(100),
	"external_id" varchar(100),
	"category" varchar(255),
	"sub_category" varchar(255),
	"material" varchar(500),
	"color" varchar(100),
	"length" numeric(10, 2),
	"width" numeric(10, 2),
	"height" numeric(10, 2),
	"dimensions" varchar(100),
	"weight" numeric(10, 2),
	"image_url" text,
	"image_urls" text,
	"country_of_origin" varchar(10),
	"ean_code" varchar(50),
	"raw_data" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"provider_name" varchar(100) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"delivery_days" integer NOT NULL,
	"reliability_score" numeric(5, 2) NOT NULL,
	"response_time" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"permission" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "free_day_requests" ADD CONSTRAINT "free_day_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_product_provider_id_product_providers_id_fk" FOREIGN KEY ("product_provider_id") REFERENCES "public"."product_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_requests" ADD CONSTRAINT "product_requests_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_quotes" ADD CONSTRAINT "provider_quotes_request_id_product_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."product_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;