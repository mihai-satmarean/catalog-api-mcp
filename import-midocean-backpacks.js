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
    } else {
      console.log('Response structure:', Object.keys(data));
      products = [data]; // Try single product
    }

    console.log(`Found ${products.length} products from Midocean`);
    
    // Filter for backpacks
    const backpackProducts = products.filter(p => {
      const name = (p.Name || p.name || p.ProductName || p.productName || '').toLowerCase();
      const desc = (p.Description || p.description || p.ShortDescription || p.shortDescription || '').toLowerCase();
      const category = (p.Category || p.category || p.CategoryCode || p.categoryCode || '').toLowerCase();
      
      return name.includes('backpack') || 
             name.includes('bagpack') || 
             desc.includes('backpack') || 
             desc.includes('bagpack') ||
             category.includes('backpack') ||
             category.includes('bagpack');
    });

    console.log(`Found ${backpackProducts.length} backpack products\n`);

    if (backpackProducts.length === 0) {
      console.log('No backpacks found. Showing first 5 products for reference:');
      products.slice(0, 5).forEach((p, i) => {
        console.log(`${i+1}. ${p.Name || p.name || p.ProductName || p.productName || 'Unknown'} - ${p.MasterCode || p.masterCode || p.Code || 'N/A'}`);
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
      const name = p.Name || p.name || p.ProductName || p.productName || 'Unknown Product';
      const desc = p.Description || p.description || p.ShortDescription || p.shortDescription || null;
      const masterCode = p.MasterCode || p.masterCode || null;
      const productCode = p.Code || p.code || masterCode;
      const category = p.Category || p.category || p.CategoryCode || p.categoryCode || null;
      const productName = p.ProductName || p.productName || name;

      stmt.run(
        id,
        name,
        desc,
        'midocean',
        'Midocean',
        productCode,
        masterCode,
        category,
        productName,
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
    db.close();
    process.exit(1);
  }
}

fetchMidoceanProducts();



