-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Role permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id TEXT PRIMARY KEY,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role_id TEXT REFERENCES roles(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price REAL,
  source TEXT,
  brand TEXT,
  product_code TEXT,
  external_id TEXT,
  category TEXT,
  sub_category TEXT,
  material TEXT,
  color TEXT,
  length REAL,
  width REAL,
  height REAL,
  dimensions TEXT,
  weight REAL,
  image_url TEXT,
  image_urls TEXT,
  country_of_origin TEXT,
  ean_code TEXT,
  master_code TEXT,
  master_id TEXT,
  type_of_products TEXT,
  commodity_code TEXT,
  number_of_print_positions TEXT,
  product_name TEXT,
  category_code TEXT,
  product_class TEXT,
  length_unit TEXT,
  width_unit TEXT,
  height_unit TEXT,
  volume REAL,
  volume_unit TEXT,
  gross_weight REAL,
  gross_weight_unit TEXT,
  net_weight REAL,
  net_weight_unit TEXT,
  inner_carton_quantity INTEGER,
  outer_carton_quantity INTEGER,
  carton_length REAL,
  carton_length_unit TEXT,
  carton_width REAL,
  carton_width_unit TEXT,
  carton_height REAL,
  carton_height_unit TEXT,
  carton_volume REAL,
  carton_volume_unit TEXT,
  carton_gross_weight REAL,
  carton_gross_weight_unit TEXT,
  short_description TEXT,
  long_description TEXT,
  packaging_after_printing TEXT,
  printable TEXT,
  timestamp INTEGER,
  raw_data TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Product requests table
CREATE TABLE IF NOT EXISTS product_requests (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity REAL NOT NULL,
  personalization_remarks TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Provider quotes table
CREATE TABLE IF NOT EXISTS provider_quotes (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES product_requests(id),
  provider_name TEXT NOT NULL,
  price REAL NOT NULL,
  delivery_days INTEGER NOT NULL,
  reliability_score REAL NOT NULL,
  response_time INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Product providers table
CREATE TABLE IF NOT EXISTS product_providers (
  id TEXT PRIMARY KEY,
  feed_created_date_time INTEGER,
  item_data_last_modified_date_time INTEGER,
  model_code TEXT,
  item_code TEXT NOT NULL UNIQUE,
  product_life_cycle TEXT,
  intro_date INTEGER,
  item_name TEXT,
  long_description TEXT,
  brand TEXT,
  main_category TEXT,
  sub_category TEXT,
  material TEXT,
  color TEXT,
  pms_color1 TEXT,
  hex_color1 TEXT,
  item_length_cm REAL,
  item_width_cm REAL,
  item_height_cm REAL,
  item_dimensions TEXT,
  item_weight_net_gr REAL,
  item_weight_gross_gr REAL,
  country_of_origin TEXT,
  commodity_code TEXT,
  ean_code TEXT,
  packaging_type_item TEXT,
  outer_carton_length_cm REAL,
  outer_carton_width_cm REAL,
  outer_carton_height_cm REAL,
  outer_carton_dimensions TEXT,
  outer_carton_weight_net_kg REAL,
  outer_carton_weight_gross_kg REAL,
  innerbox_qty INTEGER,
  outer_carton_qty INTEGER,
  compliance TEXT,
  certifications TEXT,
  social_audits TEXT,
  eco INTEGER,
  traceability TEXT,
  charity TEXT,
  pvc_free INTEGER,
  digital_passport TEXT,
  leak_prevention TEXT,
  total_co2_emissions REAL,
  total_co2_emissions_benchmark REAL,
  lca_total_co2_kg_emissions REAL,
  lca_total_co2_kg_emissions_benchmark REAL,
  lca_co2_gr_material_and_production REAL,
  lca_co2_gr_packaging REAL,
  lca_co2_gr_transport REAL,
  lca_co2_gr_eol REAL,
  lca_co2_percent_material_and_production REAL,
  lca_co2_percent_packaging REAL,
  lca_co2_percent_transport REAL,
  lca_co2_percent_eol REAL,
  all_images TEXT,
  main_image TEXT,
  main_image_neutral TEXT,
  extra_image1 TEXT,
  extra_image2 TEXT,
  extra_image3 TEXT,
  image_print TEXT,
  all_print_codes TEXT,
  print_code_default TEXT,
  print_technique_default TEXT,
  print_position_default TEXT,
  max_print_width_default_mm INTEGER,
  max_print_height_default_mm INTEGER,
  max_print_area_default TEXT,
  max_colors_default INTEGER,
  line_drawing_default TEXT,
  variable_data_printing INTEGER,
  custom_sleeve_possible INTEGER,
  gift_wrapping_possible INTEGER,
  usp TEXT,
  gpsr_contact TEXT,
  gpsr_website TEXT,
  imagefile_3d TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Product prices table
CREATE TABLE IF NOT EXISTS product_prices (
  id TEXT PRIMARY KEY,
  product_provider_id TEXT REFERENCES product_providers(id) ON DELETE CASCADE,
  item_code TEXT NOT NULL,
  currency TEXT,
  price_tier1_qty INTEGER,
  price_tier1_price REAL,
  price_tier2_qty INTEGER,
  price_tier2_price REAL,
  price_tier3_qty INTEGER,
  price_tier3_price REAL,
  price_tier4_qty INTEGER,
  price_tier4_price REAL,
  price_tier5_qty INTEGER,
  price_tier5_price REAL,
  unit_price REAL,
  minimum_order_quantity INTEGER,
  effective_date INTEGER,
  expiry_date INTEGER,
  raw_data TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Free day requests table
CREATE TABLE IF NOT EXISTS free_day_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  start_date INTEGER NOT NULL,
  end_date INTEGER NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Product variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id TEXT,
  sku TEXT,
  release_date INTEGER,
  discontinued_date INTEGER,
  product_proposition_category TEXT,
  category_level1 TEXT,
  category_level2 TEXT,
  category_level3 TEXT,
  color_description TEXT,
  color_group TEXT,
  plc_status TEXT,
  plc_status_description TEXT,
  gtin TEXT,
  color_code TEXT,
  pms_color TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Digital assets table
CREATE TABLE IF NOT EXISTS digital_assets (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  variant_id TEXT REFERENCES product_variants(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  url_high_res TEXT,
  type TEXT NOT NULL,
  subtype TEXT,
  created_at INTEGER NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_product_requests_product_id ON product_requests(product_id);
CREATE INDEX IF NOT EXISTS idx_product_requests_status ON product_requests(status);
CREATE INDEX IF NOT EXISTS idx_provider_quotes_request_id ON provider_quotes(request_id);
CREATE INDEX IF NOT EXISTS idx_free_day_requests_user_id ON free_day_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_digital_assets_product_id ON digital_assets(product_id);
CREATE INDEX IF NOT EXISTS idx_digital_assets_variant_id ON digital_assets(variant_id);



