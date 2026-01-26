const Database = require('better-sqlite3');
const db = new Database('./sqlite.db');

// Midocean API configuration
const API_KEY = 'd1f5db62-b565-4b39-a9f5-ac52c105c7c8';
const BASE_URL = 'https://apitest.midocean.com';
const PRODUCTS_URL = `${BASE_URL}/gateway/products/2.0?language=en`;

async function fetchMidoceanProducts() {
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
    
    // Log structure for debugging
    console.log('Response type:', typeof data);
    console.log('Is array:', Array.isArray(data));
    if (typeof data === 'object' && !Array.isArray(data)) {
      console.log('Response keys:', Object.keys(data));
    }
    
    // Midocean API returns data in different formats, check structure
    let products = [];
    if (Array.isArray(data)) {
      products = data;
    } else if (data.products && Array.isArray(data.products)) {
      products = data.products;
    } else if (data.data && Array.isArray(data.data)) {
      products = data.data;
    } else if (data.MasterProducts && Array.isArray(data.MasterProducts)) {
      products = data.MasterProducts;
    } else if (data.masterProducts && Array.isArray(data.masterProducts)) {
      products = data.masterProducts;
    } else {
      // Try to find any array in the response
      for (const key in data) {
        if (Array.isArray(data[key])) {
          console.log(`Found array in key: ${key} with ${data[key].length} items`);
          products = data[key];
          break;
        }
      }
    }

    console.log(`Found ${products.length} products from Midocean`);
    
    if (products.length > 0) {
      // Show first product structure
      console.log('\nFirst product structure:');
      console.log(JSON.stringify(products[0], null, 2).substring(0, 500));
    }
    
    // Filter for backpacks - check multiple possible field names
    const backpackProducts = products.filter(p => {
      const name = (p.Name || p.name || p.ProductName || p.productName || p.product_name || p.shortDescription || p.ShortDescription || p.short_description || '').toLowerCase();
      const desc = (p.Description || p.description || p.LongDescription || p.longDescription || p.long_description || '').toLowerCase();
      const category = (p.Category || p.category || p.CategoryCode || p.categoryCode || p.category_code || p.ProductClass || p.productClass || p.product_class || '').toLowerCase();
      const masterCode = (p.MasterCode || p.masterCode || p.master_code || '').toLowerCase();
      
      return name.includes('backpack') || 
             name.includes('bagpack') || 
             name.includes('rucksack') ||
             desc.includes('backpack') || 
             desc.includes('bagpack') ||
             desc.includes('rucksack') ||
             category.includes('backpack') ||
             category.includes('bagpack') ||
             category.includes('rucksack') ||
             masterCode.includes('backpack') ||
             masterCode.includes('bagpack');
    });

    console.log(`\nFound ${backpackProducts.length} backpack products\n`);

    if (backpackProducts.length === 0) {
      console.log('No backpacks found. Showing first 10 products for reference:');
      products.slice(0, 10).forEach((p, i) => {
        const name = p.Name || p.name || p.ProductName || p.productName || p.product_name || p.shortDescription || p.ShortDescription || 'Unknown';
        const code = p.MasterCode || p.masterCode || p.master_code || p.Code || p.code || 'N/A';
        console.log(`${i+1}. ${name} - ${code}`);
      });
      return;
    }

    // Import backpack products
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO products (
        id, name, description, source, brand, product_code, master_code,
        category, product_name, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let imported = 0;
    for (const p of backpackProducts.slice(0, 10)) { // Limit to 10
      const id = p.Id || p.id || `midocean-${p.MasterCode || p.masterCode || Date.now()}`;
      const name = p.Name || p.name || p.ProductName || p.productName || p.product_name || p.shortDescription || p.ShortDescription || 'Unknown Product';
      const desc = p.Description || p.description || p.LongDescription || p.longDescription || p.long_description || null;
      const masterCode = p.MasterCode || p.masterCode || p.master_code || null;
      const productCode = p.Code || p.code || masterCode;
      const category = p.Category || p.category || p.CategoryCode || p.categoryCode || p.ProductClass || p.productClass || null;
      const productName = p.ProductName || p.productName || p.product_name || name;

      stmt.run(
        id,
        name.substring(0, 255),
        desc ? desc.substring(0, 1000) : null,
        'midocean',
        'Midocean',
        productCode,
        masterCode,
        category,
        productName ? productName.substring(0, 255) : null,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000)
      );
      imported++;
      console.log(`${imported}. ${name} (${masterCode || productCode})`);
    }

    console.log(`\n✅ Imported ${imported} backpack products from Midocean`);
    db.close();
  } catch (error) {
    console.error('Error:', error.message);
    if (error.stack) console.error(error.stack);
    db.close();
    process.exit(1);
  }
}

fetchMidoceanProducts();



