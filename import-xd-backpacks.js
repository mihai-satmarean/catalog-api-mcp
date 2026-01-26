const Database = require('better-sqlite3');
const db = new Database('./sqlite.db');

const FEED_URL = 'https://feeds.xindao.com/Feeds/Download/2480-hNbCJ809IMnNhlXSXmrB_94sSJe0BZn5THm2VC0WXfDlY1ChSF1TEwO3T-BfZav7b5vptiGrZ9sI2noY8-Su8t_a/Xindao.V6.Products-en-gb-C40084.json';

async function importBackpacks() {
  try {
    console.log('Fetching XD Connects products...');
    const response = await fetch(FEED_URL);
    const products = await response.json();
    
    const backpacks = products.filter(p => {
      const name = (p.ItemName || '').toLowerCase();
      const category = (p.MainCategory || '').toLowerCase();
      const subCategory = (p.SubCategory || '').toLowerCase();
      return name.includes('backpack') || 
             name.includes('bagpack') ||
             name.includes('rucksack') ||
             category.includes('backpack') ||
             subCategory.includes('backpack');
    });

    console.log(`Found ${backpacks.length} backpack products`);
    console.log('Importing first 3...\n');

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO product_providers (
        item_code, item_name, brand, main_category, sub_category,
        material, color, item_length_cm, item_width_cm, item_height_cm,
        country_of_origin, ean_code, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let imported = 0;
    for (let i = 0; i < Math.min(3, backpacks.length); i++) {
      const p = backpacks[i];
      if (!p.ItemCode) continue;

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
      console.log(`${imported}. ${p.ItemName} (${p.ItemCode})`);
    }

    console.log(`\n✅ Imported ${imported} backpack products from XD Connects`);
    db.close();
  } catch (error) {
    console.error('Error:', error.message);
    db.close();
    process.exit(1);
  }
}

importBackpacks();



