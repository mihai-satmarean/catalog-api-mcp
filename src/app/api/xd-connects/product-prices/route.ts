import { NextRequest, NextResponse } from 'next/server';
import { getProductPrices } from '@/lib/providers/xd-connects/client';
import { db, productPrices, productProviders } from '@/db';
import { eq } from 'drizzle-orm';

// Helper function to transform XD price data to database format
function transformPriceData(price: any) {
  // Try to extract common price fields
  const itemCode = price.ItemCode || price.itemCode || null;
  
  // Helper to safely extract and convert price values
  const extractPrice = (val: any): string | null => {
    if (val == null || val === '') return null;
    const numVal = Number(val);
    if (isNaN(numVal)) return null;
    return numVal.toString();
  };

  // Extract price tiers if they exist (common formats)
  const extractPriceTier = (tier: any, index: number) => {
    if (!tier) return { qty: null, price: null };
    
    // Handle different possible formats
    const qty = tier.Quantity || tier.Qty || tier.quantity || tier.qty || tier[`Tier${index}Qty`] || null;
    const priceValue = tier.Price || tier.price || tier[`Tier${index}Price`] || null;
    
    return {
      qty: qty != null ? Math.round(Number(qty)) : null,
      price: extractPrice(priceValue),
    };
  };

  // Try to extract price tiers from various possible structures
  const tier1 = extractPriceTier(price.PriceTier1 || price.priceTier1 || price.Tier1, 1);
  const tier2 = extractPriceTier(price.PriceTier2 || price.priceTier2 || price.Tier2, 2);
  const tier3 = extractPriceTier(price.PriceTier3 || price.priceTier3 || price.Tier3, 3);
  const tier4 = extractPriceTier(price.PriceTier4 || price.priceTier4 || price.Tier4, 4);
  const tier5 = extractPriceTier(price.PriceTier5 || price.priceTier5 || price.Tier5, 5);

  // Try to extract unit price from various possible field names
  const unitPrice = extractPrice(
    price.UnitPrice || price.unitPrice || price.Price || price.price || 
    price.BasePrice || price.basePrice || price.StandardPrice || price.standardPrice
  );

  return {
    itemCode,
    currency: price.Currency || price.currency || price.CurrencyCode || price.currencyCode || null,
    priceTier1Qty: tier1.qty,
    priceTier1Price: tier1.price,
    priceTier2Qty: tier2.qty,
    priceTier2Price: tier2.price,
    priceTier3Qty: tier3.qty,
    priceTier3Price: tier3.price,
    priceTier4Qty: tier4.qty,
    priceTier4Price: tier4.price,
    priceTier5Qty: tier5.qty,
    priceTier5Price: tier5.price,
    unitPrice,
    minimumOrderQuantity: price.MinimumOrderQuantity || price.minimumOrderQuantity || price.MinQty || price.minQty 
      ? Math.round(Number(price.MinimumOrderQuantity || price.minimumOrderQuantity || price.MinQty || price.minQty))
      : null,
    effectiveDate: price.EffectiveDate || price.effectiveDate ? new Date(price.EffectiveDate || price.effectiveDate) : null,
    expiryDate: price.ExpiryDate || price.expiryDate ? new Date(price.ExpiryDate || price.expiryDate) : null,
    rawData: JSON.stringify(price), // Store original data for reference
  };
}

export async function GET(request: NextRequest) {
  try {
    const data = await getProductPrices();
    
    // If data is an array, save each price to the database
    if (Array.isArray(data)) {
      const savedPrices = [];
      const errors: Array<{ itemCode: string; error: string }> = [];
      
      for (const price of data) {
        const transformedPrice = transformPriceData(price);
        
        if (!transformedPrice.itemCode) {
          console.warn('Skipping price without ItemCode:', price);
          continue;
        }

        try {
          // Find the corresponding product provider
          const [productProvider] = await db
            .select()
            .from(productProviders)
            .where(eq(productProviders.itemCode, transformedPrice.itemCode))
            .limit(1);

          // Check if price already exists for this itemCode
          const [existingPrice] = await db
            .select()
            .from(productPrices)
            .where(eq(productPrices.itemCode, transformedPrice.itemCode))
            .limit(1);

          const priceData = {
            ...transformedPrice,
            productProviderId: productProvider?.id || null,
            updatedAt: new Date(),
          };

          if (existingPrice) {
            // Update existing price
            const [updated] = await db
              .update(productPrices)
              .set(priceData)
              .where(eq(productPrices.itemCode, transformedPrice.itemCode))
              .returning();
            savedPrices.push(updated);
          } else {
            // Insert new price
            const [inserted] = await db
              .insert(productPrices)
              .values({
                ...priceData,
                createdAt: new Date(),
              })
              .returning();
            savedPrices.push(inserted);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Error processing price for ${transformedPrice.itemCode}:`, errorMessage);
          errors.push({ itemCode: transformedPrice.itemCode || 'unknown', error: errorMessage });
        }
      }

      return NextResponse.json({ 
        success: true, 
        data,
        saved: savedPrices.length,
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully saved ${savedPrices.length} prices to database${errors.length > 0 ? ` (${errors.length} errors)` : ''}`
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching product prices:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

