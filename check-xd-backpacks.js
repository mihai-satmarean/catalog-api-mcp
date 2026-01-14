const FEED_URL = 'https://feeds.xindao.com/Feeds/Download/2480-hNbCJ809IMnNhlXSXmrB_94sSJe0BZn5THm2VC0WXfDlY1ChSF1TEwO3T-BfZav7b5vptiGrZ9sI2noY8-Su8t_a/Xindao.V6.Products-en-gb-C40084.json';

async function checkBackpacks() {
  try {
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

    console.log(`Found ${backpacks.length} backpack products in XD Connects feed\n`);
    
    if (backpacks.length > 0) {
      console.log('First 5 backpacks:');
      backpacks.slice(0, 5).forEach((p, i) => {
        console.log(`${i+1}. ${p.ItemName} (${p.ItemCode}) - ${p.MainCategory}`);
      });
    } else {
      console.log('No backpacks found in XD Connects feed.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkBackpacks();



