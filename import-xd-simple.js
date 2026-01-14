const Database = require('better-sqlite3');
const db = new Database('./sqlite.db');

const FEED_URL = 'https://feeds.xindao.com/Feeds/Download/2480-hNbCJ809IMnNhlXSXmrB_94sSJe0BZn5THm2VC0WXfDlY1ChSF1TEwO3T-BfZav7b5vptiGrZ9sI2noY8-Su8t_a/Xindao.V6.Products-en-gb-C40084.json';

async function importProducts() {
  try {
    console.log('Fetching XD Connects products...');
    const response = await fetch(FEED_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const products = await response.json();
    
    if (!Array.isArray(products)) {
      console.error('Expected array, got:', typeof products);
      return;
    }

    console.log(`Found ${products.length} products`);
    console.log('Importing first 3 products...\n');

    let imported = 0;
    for (let i = 0; i < Math.min(3, products.length); i++) {
      const p = products[i];
      if (!p.ItemCode) continue;

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO product_providers (
          item_code, item_name, brand, main_category, sub_category,
          material, color, item_length_cm, item_width_cm, item_height_cm,
          country_of_origin, ean_code, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        p.ItemCode || null,
        p.ItemName || null,
        p.Brand || null,
        p.MainCategory || null,
        p.SubCategory || null,
        p.Material || null,
        p.Color || null,
        p.ItemLengthCM?.toString() || null,
        p.ItemWidthCM?.toString() || null,
        p.ItemHeightCM?.toString() || null,
        p.CountryOfOrigin || null,
        p.EANCode || null,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000)
      );
      imported++;
      console.log(`${imported}. ${p.ItemName || p.ItemCode} (${p.Brand || 'Unknown'})`);
    }

    console.log(`\n✅ Imported ${imported} products`);
    db.close();
  } catch (error) {
    console.error('Error:', error.message);
    db.close();
    process.exit(1);
  }
}

importProducts();



