import { pgTable, uuid, varchar, timestamp, text, decimal, integer, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
// Table for roles
export const roles = pgTable('roles', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Table for role permissions
export const rolePermissions = pgTable('role_permissions', {
    id: uuid('id').primaryKey().defaultRandom(),
    roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
    permission: varchar('permission', { length: 255 }).notNull(), // e.g., 'users.create', 'users.read', 'products.delete'
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    roleId: uuid('role_id').references(() => roles.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Table for products
export const products = pgTable('products', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    price: decimal('price', { precision: 10, scale: 2 }), // Made optional as prices may come from pricelist API
    // Source/Brand identification
    source: varchar('source', { length: 50 }), // 'midocean', 'xd-connects', 'manual', etc.
    brand: varchar('brand', { length: 255 }), // Product brand name
    // Product identification
    productCode: varchar('product_code', { length: 100 }), // SKU/Product code from provider
    externalId: varchar('external_id', { length: 100 }), // External product ID from provider API
    // Category information
    category: varchar('category', { length: 255 }),
    subCategory: varchar('sub_category', { length: 255 }),
    // Product details
    material: varchar('material', { length: 500 }),
    color: varchar('color', { length: 100 }),
    // Dimensions
    length: decimal('length', { precision: 10, scale: 2 }), // in cm
    width: decimal('width', { precision: 10, scale: 2 }), // in cm
    height: decimal('height', { precision: 10, scale: 2 }), // in cm
    dimensions: varchar('dimensions', { length: 100 }), // Formatted dimensions string
    // Weight
    weight: decimal('weight', { precision: 10, scale: 2 }), // in grams
    // Images
    imageUrl: text('image_url'), // Main product image URL
    imageUrls: text('image_urls'), // JSON array of additional image URLs
    // Additional metadata
    countryOfOrigin: varchar('country_of_origin', { length: 10 }),
    eanCode: varchar('ean_code', { length: 50 }), // EAN/UPC barcode
    // Midocean-specific master product fields
    masterCode: varchar('master_code', { length: 100 }), // Master code (e.g., "AR1249")
    masterId: varchar('master_id', { length: 100 }), // Master ID (e.g., "40000011")
    typeOfProducts: varchar('type_of_products', { length: 50 }), // e.g., "stock"
    commodityCode: varchar('commodity_code', { length: 50 }), // e.g., "9014 1000"
    numberOfPrintPositions: varchar('number_of_print_positions', { length: 10 }), // e.g., "4"
    productName: varchar('product_name', { length: 255 }), // Product name from Midocean
    categoryCode: varchar('category_code', { length: 100 }), // e.g., "MOBL&G_SRVCOP"
    productClass: varchar('product_class', { length: 255 }), // e.g., "Sport & receation accessories"
    lengthUnit: varchar('length_unit', { length: 10 }), // e.g., "cm"
    widthUnit: varchar('width_unit', { length: 10 }), // e.g., "cm"
    heightUnit: varchar('height_unit', { length: 10 }), // e.g., "cm"
    volume: decimal('volume', { precision: 10, scale: 2 }), // e.g., 0.34
    volumeUnit: varchar('volume_unit', { length: 10 }), // e.g., "cdm3"
    grossWeight: decimal('gross_weight', { precision: 10, scale: 2 }), // e.g., 0.138
    grossWeightUnit: varchar('gross_weight_unit', { length: 10 }), // e.g., "kg"
    netWeight: decimal('net_weight', { precision: 10, scale: 2 }), // e.g., 0.111
    netWeightUnit: varchar('net_weight_unit', { length: 10 }), // e.g., "kg"
    innerCartonQuantity: integer('inner_carton_quantity'), // e.g., 10
    outerCartonQuantity: integer('outer_carton_quantity'), // e.g., 80
    cartonLength: decimal('carton_length', { precision: 10, scale: 2 }), // e.g., 0.57
    cartonLengthUnit: varchar('carton_length_unit', { length: 10 }), // e.g., "m"
    cartonWidth: decimal('carton_width', { precision: 10, scale: 2 }), // e.g., 0.24
    cartonWidthUnit: varchar('carton_width_unit', { length: 10 }), // e.g., "m"
    cartonHeight: decimal('carton_height', { precision: 10, scale: 2 }), // e.g., 0.215
    cartonHeightUnit: varchar('carton_height_unit', { length: 10 }), // e.g., "m"
    cartonVolume: decimal('carton_volume', { precision: 10, scale: 2 }), // e.g., 0.029
    cartonVolumeUnit: varchar('carton_volume_unit', { length: 10 }), // e.g., "m3"
    cartonGrossWeight: decimal('carton_gross_weight', { precision: 10, scale: 2 }), // e.g., 10.96
    cartonGrossWeightUnit: varchar('carton_gross_weight_unit', { length: 10 }), // e.g., "kg"
    shortDescription: text('short_description'), // Short description from Midocean
    longDescription: text('long_description'), // Long description from Midocean
    packagingAfterPrinting: varchar('packaging_after_printing', { length: 255 }), // e.g., "Back in MO Box"
    printable: varchar('printable', { length: 10 }), // e.g., "yes" or "no"
    timestamp: timestamp('timestamp', { withTimezone: true }), // Product timestamp from Midocean
    // Raw data storage for flexibility
    rawData: text('raw_data'), // JSON string of original API response data
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Table for product requests
export const productRequests = pgTable('product_requests', {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').notNull().references(() => products.id),
    productName: varchar('product_name', { length: 255 }).notNull(),
    quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
    personalizationRemarks: text('personalization_remarks'),
    status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, approved, rejected, fulfilled
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Table for provider quotes
export const providerQuotes = pgTable('provider_quotes', {
    id: uuid('id').primaryKey().defaultRandom(),
    requestId: uuid('request_id').notNull().references(() => productRequests.id),
    providerName: varchar('provider_name', { length: 100 }).notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    deliveryDays: integer('delivery_days').notNull(),
    reliabilityScore: decimal('reliability_score', { precision: 5, scale: 2 }).notNull(), // 0-100
    responseTime: integer('response_time').notNull(), // milliseconds
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
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
export const productProviders = pgTable('product_providers', {
    id: uuid('id').primaryKey().defaultRandom(),
    feedCreatedDateTime: timestamp('feed_created_date_time', { withTimezone: true }),
    itemDataLastModifiedDateTime: timestamp('item_data_last_modified_date_time', { withTimezone: true }),
    modelCode: varchar('model_code', { length: 100 }),
    itemCode: varchar('item_code', { length: 100 }).notNull().unique(),
    productLifeCycle: varchar('product_life_cycle', { length: 50 }),
    introDate: timestamp('intro_date', { withTimezone: true }),
    itemName: varchar('item_name', { length: 500 }),
    longDescription: text('long_description'),
    brand: varchar('brand', { length: 255 }),
    mainCategory: varchar('main_category', { length: 255 }),
    subCategory: varchar('sub_category', { length: 255 }),
    material: varchar('material', { length: 500 }),
    color: varchar('color', { length: 100 }),
    pmsColor1: varchar('pms_color1', { length: 100 }),
    hexColor1: varchar('hex_color1', { length: 10 }),
    itemLengthCM: decimal('item_length_cm', { precision: 10, scale: 2 }),
    itemWidthCM: decimal('item_width_cm', { precision: 10, scale: 2 }),
    itemHeightCM: decimal('item_height_cm', { precision: 10, scale: 2 }),
    itemDimensions: varchar('item_dimensions', { length: 100 }),
    itemWeightNetGr: decimal('item_weight_net_gr', { precision: 10, scale: 2 }),
    itemWeightGrossGr: decimal('item_weight_gross_gr', { precision: 10, scale: 2 }),
    countryOfOrigin: varchar('country_of_origin', { length: 10 }),
    commodityCode: varchar('commodity_code', { length: 50 }),
    eanCode: varchar('ean_code', { length: 50 }),
    packagingTypeItem: varchar('packaging_type_item', { length: 100 }),
    outerCartonLengthCM: decimal('outer_carton_length_cm', { precision: 10, scale: 2 }),
    outerCartonWidthCM: decimal('outer_carton_width_cm', { precision: 10, scale: 2 }),
    outerCartonHeightCM: decimal('outer_carton_height_cm', { precision: 10, scale: 2 }),
    outerCartonDimensions: varchar('outer_carton_dimensions', { length: 100 }),
    outerCartonWeightNetKG: decimal('outer_carton_weight_net_kg', { precision: 10, scale: 2 }),
    outerCartonWeightGrossKG: decimal('outer_carton_weight_gross_kg', { precision: 10, scale: 2 }),
    innerboxQty: integer('innerbox_qty'),
    outerCartonQty: integer('outer_carton_qty'),
    compliance: text('compliance'),
    certifications: text('certifications'),
    socialAudits: varchar('social_audits', { length: 255 }),
    eco: boolean('eco'),
    traceability: varchar('traceability', { length: 255 }),
    charity: varchar('charity', { length: 255 }),
    pvcFree: boolean('pvc_free'),
    digitalPassport: text('digital_passport'),
    leakPrevention: varchar('leak_prevention', { length: 255 }),
    totalCO2Emissions: decimal('total_co2_emissions', { precision: 10, scale: 2 }),
    totalCO2EmissionsBenchmark: decimal('total_co2_emissions_benchmark', { precision: 10, scale: 2 }),
    lcaTotalCO2KgEmissions: decimal('lca_total_co2_kg_emissions', { precision: 10, scale: 2 }),
    lcaTotalCO2KgEmissionsBenchmark: decimal('lca_total_co2_kg_emissions_benchmark', { precision: 10, scale: 2 }),
    lcaCO2GrMaterialAndProduction: decimal('lca_co2_gr_material_and_production', { precision: 10, scale: 2 }),
    lcaCO2GrPackaging: decimal('lca_co2_gr_packaging', { precision: 10, scale: 2 }),
    lcaCO2GrTransport: decimal('lca_co2_gr_transport', { precision: 10, scale: 2 }),
    lcaCO2GrEOL: decimal('lca_co2_gr_eol', { precision: 10, scale: 2 }),
    lcaCO2PercentMaterialAndProduction: decimal('lca_co2_percent_material_and_production', { precision: 10, scale: 2 }),
    lcaCO2PercentPackaging: decimal('lca_co2_percent_packaging', { precision: 10, scale: 2 }),
    lcaCO2PercentTransport: decimal('lca_co2_percent_transport', { precision: 10, scale: 2 }),
    lcaCO2PercentEOL: decimal('lca_co2_percent_eol', { precision: 10, scale: 2 }),
    allImages: text('all_images'),
    mainImage: text('main_image'),
    mainImageNeutral: text('main_image_neutral'),
    extraImage1: text('extra_image1'),
    extraImage2: text('extra_image2'),
    extraImage3: text('extra_image3'),
    imagePrint: text('image_print'),
    allPrintCodes: varchar('all_print_codes', { length: 500 }),
    printCodeDefault: varchar('print_code_default', { length: 255 }),
    printTechniqueDefault: varchar('print_technique_default', { length: 255 }),
    printPositionDefault: varchar('print_position_default', { length: 255 }),
    maxPrintWidthDefaultMM: integer('max_print_width_default_mm'),
    maxPrintHeightDefaultMM: integer('max_print_height_default_mm'),
    maxPrintAreaDefault: varchar('max_print_area_default', { length: 100 }),
    maxColorsDefault: integer('max_colors_default'),
    lineDrawingDefault: text('line_drawing_default'),
    variableDataPrinting: boolean('variable_data_printing'),
    customSleevePossible: boolean('custom_sleeve_possible'),
    giftWrappingPossible: boolean('gift_wrapping_possible'),
    usp: text('usp'),
    gpsrContact: varchar('gpsr_contact', { length: 255 }),
    gpsrWebsite: text('gpsr_website'),
    imagefile3D: text('imagefile_3d'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Zod schemas for product_providers
export const insertProductProviderSchema = createInsertSchema(productProviders);
export const selectProductProviderSchema = createSelectSchema(productProviders);
// Table for product prices (XD Connects product prices)
export const productPrices = pgTable('product_prices', {
    id: uuid('id').primaryKey().defaultRandom(),
    productProviderId: uuid('product_provider_id').references(() => productProviders.id, { onDelete: 'cascade' }),
    itemCode: varchar('item_code', { length: 100 }).notNull(),
    currency: varchar('currency', { length: 10 }),
    priceTier1Qty: integer('price_tier1_qty'),
    priceTier1Price: decimal('price_tier1_price', { precision: 10, scale: 2 }),
    priceTier2Qty: integer('price_tier2_qty'),
    priceTier2Price: decimal('price_tier2_price', { precision: 10, scale: 2 }),
    priceTier3Qty: integer('price_tier3_qty'),
    priceTier3Price: decimal('price_tier3_price', { precision: 10, scale: 2 }),
    priceTier4Qty: integer('price_tier4_qty'),
    priceTier4Price: decimal('price_tier4_price', { precision: 10, scale: 2 }),
    priceTier5Qty: integer('price_tier5_qty'),
    priceTier5Price: decimal('price_tier5_price', { precision: 10, scale: 2 }),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }),
    minimumOrderQuantity: integer('minimum_order_quantity'),
    effectiveDate: timestamp('effective_date', { withTimezone: true }),
    expiryDate: timestamp('expiry_date', { withTimezone: true }),
    // Store raw JSON data for flexibility
    rawData: text('raw_data'), // JSON string of the original price data
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Zod schemas for product_prices
export const insertProductPriceSchema = createInsertSchema(productPrices);
export const selectProductPriceSchema = createSelectSchema(productPrices);
// Table for free day requests
export const freeDayRequests = pgTable('free_day_requests', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 50 }).notNull(), // 'concediu', 'sanatate', 'birthdata'
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    reason: text('reason'),
    status: varchar('status', { length: 50 }).notNull().default('pending'), // 'pending', 'approved', 'rejected'
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Zod schemas for free_day_requests
export const insertFreeDayRequestSchema = createInsertSchema(freeDayRequests);
export const selectFreeDayRequestSchema = createSelectSchema(freeDayRequests);
// Table for product variants (Midocean variants)
export const productVariants = pgTable('product_variants', {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    variantId: varchar('variant_id', { length: 100 }), // e.g., "10134325"
    sku: varchar('sku', { length: 100 }), // e.g., "AR1249-16"
    releaseDate: timestamp('release_date', { withTimezone: true }),
    discontinuedDate: timestamp('discontinued_date', { withTimezone: true }),
    productPropositionCategory: varchar('product_proposition_category', { length: 50 }), // e.g., "978"
    categoryLevel1: varchar('category_level1', { length: 255 }), // e.g., "Outdoor & leisure"
    categoryLevel2: varchar('category_level2', { length: 255 }), // e.g., "Sport & health"
    categoryLevel3: varchar('category_level3', { length: 255 }), // e.g., "Running & hiking accessories"
    colorDescription: varchar('color_description', { length: 255 }), // e.g., "Matt Silver"
    colorGroup: varchar('color_group', { length: 100 }), // e.g., "Silver"
    plcStatus: varchar('plc_status', { length: 10 }), // e.g., "16"
    plcStatusDescription: varchar('plc_status_description', { length: 100 }), // e.g., "COLLECTION"
    gtin: varchar('gtin', { length: 50 }), // e.g., "8719941007840"
    colorCode: varchar('color_code', { length: 20 }), // e.g., "16"
    pmsColor: varchar('pms_color', { length: 100 }), // e.g., "SILVER"
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Table for digital assets (images and documents)
export const digitalAssets = pgTable('digital_assets', {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
    url: text('url').notNull(), // URL of the asset
    urlHighRes: text('url_high_res'), // High resolution URL (for images)
    type: varchar('type', { length: 50 }).notNull(), // 'image' or 'document'
    subtype: varchar('subtype', { length: 100 }), // e.g., 'item_picture_front', 'declaration_of_sustainability', etc.
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
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
//# sourceMappingURL=schema.js.map