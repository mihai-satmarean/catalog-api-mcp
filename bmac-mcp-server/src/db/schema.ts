
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { relations } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Table for roles
export const roles = sqliteTable('roles', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Table for role permissions
export const rolePermissions = sqliteTable('role_permissions', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permission: text('permission').notNull(), // e.g., 'users.create', 'users.read', 'products.delete'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  roleId: text('role_id').references(() => roles.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Table for products
export const products = sqliteTable('products', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price'), // Made optional as prices may come from pricelist API
  // Source/Brand identification
  source: text('source'), // 'midocean', 'xd-connects', 'manual', etc.
  brand: text('brand'), // Product brand name
  // Product identification
  productCode: text('product_code'), // SKU/Product code from provider
  externalId: text('external_id'), // External product ID from provider API
  // Category information
  category: text('category'),
  subCategory: text('sub_category'),
  // Product details
  material: text('material'),
  color: text('color'),
  // Dimensions
  length: real('length'), // in cm
  width: real('width'), // in cm
  height: real('height'), // in cm
  dimensions: text('dimensions'), // Formatted dimensions string
  // Weight
  weight: real('weight'), // in grams
  // Images
  imageUrl: text('image_url'), // Main product image URL
  imageUrls: text('image_urls'), // JSON array of additional image URLs
  // Additional metadata
  countryOfOrigin: text('country_of_origin'),
  eanCode: text('ean_code'), // EAN/UPC barcode
  // Midocean-specific master product fields
  masterCode: text('master_code'), // Master code (e.g., "AR1249")
  masterId: text('master_id'), // Master ID (e.g., "40000011")
  typeOfProducts: text('type_of_products'), // e.g., "stock"
  commodityCode: text('commodity_code'), // e.g., "9014 1000"
  numberOfPrintPositions: text('number_of_print_positions'), // e.g., "4"
  productName: text('product_name'), // Product name from Midocean
  categoryCode: text('category_code'), // e.g., "MOBL&G_SRVCOP"
  productClass: text('product_class'), // e.g., "Sport & receation accessories"
  lengthUnit: text('length_unit'), // e.g., "cm"
  widthUnit: text('width_unit'), // e.g., "cm"
  heightUnit: text('height_unit'), // e.g., "cm"
  volume: real('volume'), // e.g., 0.34
  volumeUnit: text('volume_unit'), // e.g., "cdm3"
  grossWeight: real('gross_weight'), // e.g., 0.138
  grossWeightUnit: text('gross_weight_unit'), // e.g., "kg"
  netWeight: real('net_weight'), // e.g., 0.111
  netWeightUnit: text('net_weight_unit'), // e.g., "kg"
  innerCartonQuantity: integer('inner_carton_quantity'), // e.g., 10
  outerCartonQuantity: integer('outer_carton_quantity'), // e.g., 80
  cartonLength: real('carton_length'), // e.g., 0.57
  cartonLengthUnit: text('carton_length_unit'), // e.g., "m"
  cartonWidth: real('carton_width'), // e.g., 0.24
  cartonWidthUnit: text('carton_width_unit'), // e.g., "m"
  cartonHeight: real('carton_height'), // e.g., 0.215
  cartonHeightUnit: text('carton_height_unit'), // e.g., "m"
  cartonVolume: real('carton_volume'), // e.g., 0.029
  cartonVolumeUnit: text('carton_volume_unit'), // e.g., "m3"
  cartonGrossWeight: real('carton_gross_weight'), // e.g., 10.96
  cartonGrossWeightUnit: text('carton_gross_weight_unit'), // e.g., "kg"
  shortDescription: text('short_description'), // Short description from Midocean
  longDescription: text('long_description'), // Long description from Midocean
  packagingAfterPrinting: text('packaging_after_printing'), // e.g., "Back in MO Box"
  printable: text('printable'), // e.g., "yes" or "no"
  timestamp: integer('timestamp', { mode: 'timestamp' }), // Product timestamp from Midocean
  // Raw data storage for flexibility
  rawData: text('raw_data'), // JSON string of original API response data
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Table for product requests
export const productRequests = sqliteTable('product_requests', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  productId: text('product_id').notNull().references(() => products.id),
  productName: text('product_name').notNull(),
  quantity: real('quantity').notNull(),
  personalizationRemarks: text('personalization_remarks'),
  status: text('status').notNull().default('pending'), // pending, approved, rejected, fulfilled
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Table for provider quotes
export const providerQuotes = sqliteTable('provider_quotes', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  requestId: text('request_id').notNull().references(() => productRequests.id),
  providerName: text('provider_name').notNull(),
  price: real('price').notNull(),
  deliveryDays: integer('delivery_days').notNull(),
  reliabilityScore: real('reliability_score').notNull(), // 0-100
  responseTime: integer('response_time').notNull(), // milliseconds
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Relations
export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
  permissions: many(rolePermissions),
}));

export const usersRelations = relations(users, ({ one }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
}));

// Zod schemas for validation
export const insertRoleSchema = createInsertSchema(roles);
export const selectRoleSchema = createSelectSchema(roles);

export const insertRolePermissionSchema = createInsertSchema(rolePermissions);
export const selectRolePermissionSchema = createSelectSchema(rolePermissions);

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertProductSchema = createInsertSchema(products);
export const selectProductSchema = createSelectSchema(products);

export const insertProductRequestSchema = createInsertSchema(productRequests);
export const selectProductRequestSchema = createSelectSchema(productRequests);

export const insertProviderQuoteSchema = createInsertSchema(providerQuotes);
export const selectProviderQuoteSchema = createSelectSchema(providerQuotes);

// Table for product providers (XD Connects products)
export const productProviders = sqliteTable('product_providers', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  feedCreatedDateTime: integer('feed_created_date_time', { mode: 'timestamp' }),
  itemDataLastModifiedDateTime: integer('item_data_last_modified_date_time', { mode: 'timestamp' }),
  modelCode: text('model_code'),
  itemCode: text('item_code').notNull().unique(),
  productLifeCycle: text('product_life_cycle'),
  introDate: integer('intro_date', { mode: 'timestamp' }),
  itemName: text('item_name'),
  longDescription: text('long_description'),
  brand: text('brand'),
  mainCategory: text('main_category'),
  subCategory: text('sub_category'),
  material: text('material'),
  color: text('color'),
  pmsColor1: text('pms_color1'),
  hexColor1: text('hex_color1'),
  itemLengthCM: real('item_length_cm'),
  itemWidthCM: real('item_width_cm'),
  itemHeightCM: real('item_height_cm'),
  itemDimensions: text('item_dimensions'),
  itemWeightNetGr: real('item_weight_net_gr'),
  itemWeightGrossGr: real('item_weight_gross_gr'),
  countryOfOrigin: text('country_of_origin'),
  commodityCode: text('commodity_code'),
  eanCode: text('ean_code'),
  packagingTypeItem: text('packaging_type_item'),
  outerCartonLengthCM: real('outer_carton_length_cm'),
  outerCartonWidthCM: real('outer_carton_width_cm'),
  outerCartonHeightCM: real('outer_carton_height_cm'),
  outerCartonDimensions: text('outer_carton_dimensions'),
  outerCartonWeightNetKG: real('outer_carton_weight_net_kg'),
  outerCartonWeightGrossKG: real('outer_carton_weight_gross_kg'),
  innerboxQty: integer('innerbox_qty'),
  outerCartonQty: integer('outer_carton_qty'),
  compliance: text('compliance'),
  certifications: text('certifications'),
  socialAudits: text('social_audits'),
  eco: integer('eco'), // SQLite uses integer for boolean (0 or 1)
  traceability: text('traceability'),
  charity: text('charity'),
  pvcFree: integer('pvc_free'), // SQLite uses integer for boolean (0 or 1)
  digitalPassport: text('digital_passport'),
  leakPrevention: text('leak_prevention'),
  totalCO2Emissions: real('total_co2_emissions'),
  totalCO2EmissionsBenchmark: real('total_co2_emissions_benchmark'),
  lcaTotalCO2KgEmissions: real('lca_total_co2_kg_emissions'),
  lcaTotalCO2KgEmissionsBenchmark: real('lca_total_co2_kg_emissions_benchmark'),
  lcaCO2GrMaterialAndProduction: real('lca_co2_gr_material_and_production'),
  lcaCO2GrPackaging: real('lca_co2_gr_packaging'),
  lcaCO2GrTransport: real('lca_co2_gr_transport'),
  lcaCO2GrEOL: real('lca_co2_gr_eol'),
  lcaCO2PercentMaterialAndProduction: real('lca_co2_percent_material_and_production'),
  lcaCO2PercentPackaging: real('lca_co2_percent_packaging'),
  lcaCO2PercentTransport: real('lca_co2_percent_transport'),
  lcaCO2PercentEOL: real('lca_co2_percent_eol'),
  allImages: text('all_images'),
  mainImage: text('main_image'),
  mainImageNeutral: text('main_image_neutral'),
  extraImage1: text('extra_image1'),
  extraImage2: text('extra_image2'),
  extraImage3: text('extra_image3'),
  imagePrint: text('image_print'),
  allPrintCodes: text('all_print_codes'),
  printCodeDefault: text('print_code_default'),
  printTechniqueDefault: text('print_technique_default'),
  printPositionDefault: text('print_position_default'),
  maxPrintWidthDefaultMM: integer('max_print_width_default_mm'),
  maxPrintHeightDefaultMM: integer('max_print_height_default_mm'),
  maxPrintAreaDefault: text('max_print_area_default'),
  maxColorsDefault: integer('max_colors_default'),
  lineDrawingDefault: text('line_drawing_default'),
  variableDataPrinting: integer('variable_data_printing'), // SQLite uses integer for boolean (0 or 1)
  customSleevePossible: integer('custom_sleeve_possible'), // SQLite uses integer for boolean (0 or 1)
  giftWrappingPossible: integer('gift_wrapping_possible'), // SQLite uses integer for boolean (0 or 1)
  usp: text('usp'),
  gpsrContact: text('gpsr_contact'),
  gpsrWebsite: text('gpsr_website'),
  imagefile3D: text('imagefile_3d'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Zod schemas for product_providers
export const insertProductProviderSchema = createInsertSchema(productProviders);
export const selectProductProviderSchema = createSelectSchema(productProviders);

// Table for product prices (XD Connects product prices)
export const productPrices = sqliteTable('product_prices', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  productProviderId: text('product_provider_id').references(() => productProviders.id, { onDelete: 'cascade' }),
  itemCode: text('item_code').notNull(),
  currency: text('currency'),
  priceTier1Qty: integer('price_tier1_qty'),
  priceTier1Price: real('price_tier1_price'),
  priceTier2Qty: integer('price_tier2_qty'),
  priceTier2Price: real('price_tier2_price'),
  priceTier3Qty: integer('price_tier3_qty'),
  priceTier3Price: real('price_tier3_price'),
  priceTier4Qty: integer('price_tier4_qty'),
  priceTier4Price: real('price_tier4_price'),
  priceTier5Qty: integer('price_tier5_qty'),
  priceTier5Price: real('price_tier5_price'),
  unitPrice: real('unit_price'),
  minimumOrderQuantity: integer('minimum_order_quantity'),
  effectiveDate: integer('effective_date', { mode: 'timestamp' }),
  expiryDate: integer('expiry_date', { mode: 'timestamp' }),
  // Store raw JSON data for flexibility
  rawData: text('raw_data'), // JSON string of the original price data
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Zod schemas for product_prices
export const insertProductPriceSchema = createInsertSchema(productPrices);
export const selectProductPriceSchema = createSelectSchema(productPrices);

export type User = z.infer<typeof selectUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;

export type Product = z.infer<typeof selectProductSchema>;
export type NewProduct = z.infer<typeof insertProductSchema>;

export type ProductRequest = z.infer<typeof selectProductRequestSchema>;
export type NewProductRequest = z.infer<typeof insertProductRequestSchema>;

export type ProviderQuote = z.infer<typeof selectProviderQuoteSchema>;
export type NewProviderQuote = z.infer<typeof insertProviderQuoteSchema>;

export type ProductProvider = z.infer<typeof selectProductProviderSchema>;
export type NewProductProvider = z.infer<typeof insertProductProviderSchema>;

export type ProductPrice = z.infer<typeof selectProductPriceSchema>;
export type NewProductPrice = z.infer<typeof insertProductPriceSchema>;

export type Role = z.infer<typeof selectRoleSchema>;
export type NewRole = z.infer<typeof insertRoleSchema>;

export type RolePermission = z.infer<typeof selectRolePermissionSchema>;
export type NewRolePermission = z.infer<typeof insertRolePermissionSchema>;

// Table for free day requests
export const freeDayRequests = sqliteTable('free_day_requests', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'concediu', 'sanatate', 'birthdata'
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  reason: text('reason'),
  status: text('status').notNull().default('pending'), // 'pending', 'approved', 'rejected'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Zod schemas for free_day_requests
export const insertFreeDayRequestSchema = createInsertSchema(freeDayRequests);
export const selectFreeDayRequestSchema = createSelectSchema(freeDayRequests);

export type FreeDayRequest = z.infer<typeof selectFreeDayRequestSchema>;
export type NewFreeDayRequest = z.infer<typeof insertFreeDayRequestSchema>;

// Table for product variants (Midocean variants)
export const productVariants = sqliteTable('product_variants', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: text('variant_id'), // e.g., "10134325"
  sku: text('sku'), // e.g., "AR1249-16"
  releaseDate: integer('release_date', { mode: 'timestamp' }),
  discontinuedDate: integer('discontinued_date', { mode: 'timestamp' }),
  productPropositionCategory: text('product_proposition_category'), // e.g., "978"
  categoryLevel1: text('category_level1'), // e.g., "Outdoor & leisure"
  categoryLevel2: text('category_level2'), // e.g., "Sport & health"
  categoryLevel3: text('category_level3'), // e.g., "Running & hiking accessories"
  colorDescription: text('color_description'), // e.g., "Matt Silver"
  colorGroup: text('color_group'), // e.g., "Silver"
  plcStatus: text('plc_status'), // e.g., "16"
  plcStatusDescription: text('plc_status_description'), // e.g., "COLLECTION"
  gtin: text('gtin'), // e.g., "8719941007840"
  colorCode: text('color_code'), // e.g., "16"
  pmsColor: text('pms_color'), // e.g., "SILVER"
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Table for digital assets (images and documents)
export const digitalAssets = sqliteTable('digital_assets', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  productId: text('product_id').references(() => products.id, { onDelete: 'cascade' }),
  variantId: text('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
  url: text('url').notNull(), // URL of the asset
  urlHighRes: text('url_high_res'), // High resolution URL (for images)
  type: text('type').notNull(), // 'image' or 'document'
  subtype: text('subtype'), // e.g., 'item_picture_front', 'declaration_of_sustainability', etc.
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Relations for products
export const productsRelations = relations(products, ({ many }) => ({
  variants: many(productVariants),
  digitalAssets: many(digitalAssets),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  digitalAssets: many(digitalAssets),
}));

export const digitalAssetsRelations = relations(digitalAssets, ({ one }) => ({
  product: one(products, {
    fields: [digitalAssets.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [digitalAssets.variantId],
    references: [productVariants.id],
  }),
}));

// Zod schemas for product_variants
export const insertProductVariantSchema = createInsertSchema(productVariants);
export const selectProductVariantSchema = createSelectSchema(productVariants);

// Zod schemas for digital_assets
export const insertDigitalAssetSchema = createInsertSchema(digitalAssets);
export const selectDigitalAssetSchema = createSelectSchema(digitalAssets);

export type ProductVariant = z.infer<typeof selectProductVariantSchema>;
export type NewProductVariant = z.infer<typeof insertProductVariantSchema>;

export type DigitalAsset = z.infer<typeof selectDigitalAssetSchema>;
export type NewDigitalAsset = z.infer<typeof insertDigitalAssetSchema>;
