const Database = require('better-sqlite3');
const db = new Database('./sqlite.db');

// Midocean API configuration
const API_KEY = 'd1f5db62-b565-4b39-a9f5-ac52c105c7c8';
const BASE_URL = 'https://apitest.midocean.com';
const PRODUCTS_URL = `${BASE_URL}/gateway/products/2.0?language=en`;

function parseDecimal(value) {
  if (value == null || value === '') return null;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? null : num;
}

function sanitizeString(value, maxLength) {
  if (value == null || value === '') return null;
  const str = String(value).trim();
  if (str === '') return null;
  return maxLength ? str.substring(0, maxLength) : str;
}

async function reimportBackpacksWithDimensions() {
  try {
    console.log('Fetching Midocean products...');
    const response = await fetch(PRODUCTS_URL, {
      headers: {
        'Accept': 'application/json',
        'x-Gateway-APIKey': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Handle array response
    let products = Array.isArray(data) ? data : [];
    
    console.log(`Found ${products.length} products from Midocean`);
    
    // Filter for backpacks
    const backpackProducts = products.filter(p => {
      const name = (p.product_name || p.name || p.productName || '').toLowerCase();
      const desc = (p.long_description || p.description || p.short_description || '').toLowerCase();
      const category = (p.category_code || p.categoryCode || p.product_class || p.productClass || '').toLowerCase();
      const masterCode = (p.master_code || p.masterCode || '').toLowerCase();
      
      return name.includes('backpack') || 
             name.includes('bagpack') || 
             name.includes('rucksack') ||
             name.includes('rollpack') ||
             desc.includes('backpack') || 
             desc.includes('bagpack') ||
             desc.includes('rucksack') ||
             category.includes('backpack') ||
             masterCode.includes('backpack');
    });

    console.log(`Found ${backpackProducts.length} backpack products\n`);

    if (backpackProducts.length === 0) {
      console.log('No backpacks found.');
      return;
    }

    // Update products with full dimension data
    const updateStmt = db.prepare(`
      UPDATE products SET
        name = ?,
        description = ?,
        length = ?,
        width = ?,
        height = ?,
        length_unit = ?,
        width_unit = ?,
        height_unit = ?,
        dimensions = ?,
        volume = ?,
        volume_unit = ?,
        gross_weight = ?,
        gross_weight_unit = ?,
        net_weight = ?,
        net_weight_unit = ?,
        product_class = ?,
        category_code = ?,
        type_of_products = ?,
        commodity_code = ?,
        number_of_print_positions = ?,
        country_of_origin = ?,
        updated_at = ?
      WHERE source = 'midocean' AND product_code = ?
    `);

    let updated = 0;
    for (const p of backpackProducts.slice(0, 20)) {
      const productCode = p.master_code || p.masterCode || p.code || null;
      if (!productCode) continue;

      const name = p.product_name || p.name || p.productName || 'Unknown';
      const desc = p.long_description || p.description || p.short_description || null;
      
      updateStmt.run(
        name.substring(0, 255),
        desc ? desc.substring(0, 1000) : null,
        parseDecimal(p.length),
        parseDecimal(p.width),
        parseDecimal(p.height),
        sanitizeString(p.length_unit || p.lengthUnit),
        sanitizeString(p.width_unit || p.widthUnit),
        sanitizeString(p.height_unit || p.heightUnit),
        sanitizeString(p.dimensions),
        parseDecimal(p.volume),
        sanitizeString(p.volume_unit || p.volumeUnit),
        parseDecimal(p.gross_weight || p.grossWeight),
        sanitizeString(p.gross_weight_unit || p.grossWeightUnit),
        parseDecimal(p.net_weight || p.netWeight),
        sanitizeString(p.net_weight_unit || p.netWeightUnit),
        sanitizeString(p.product_class || p.productClass),
        sanitizeString(p.category_code || p.categoryCode),
        sanitizeString(p.type_of_products || p.typeOfProducts),
        sanitizeString(p.commodity_code || p.commodityCode),
        sanitizeString(p.number_of_print_positions || p.numberOfPrintPositions),
        sanitizeString(p.country_of_origin || p.countryOfOrigin),
        Math.floor(Date.now() / 1000),
        productCode
      );
      updated++;
      
      const dims = p.length && p.width && p.height 
        ? `${p.length}${p.length_unit || 'cm'} x ${p.width}${p.width_unit || 'cm'} x ${p.height}${p.height_unit || 'cm'}`
        : p.dimensions || 'No dimensions';
      console.log(`${updated}. ${name} (${productCode}) - ${dims}`);
    }

    console.log(`\n✅ Updated ${updated} backpack products with dimension data`);
    db.close();
  } catch (error) {
    console.error('Error:', error.message);
    if (error.stack) console.error(error.stack);
    db.close();
    process.exit(1);
  }
}

reimportBackpacksWithDimensions();



