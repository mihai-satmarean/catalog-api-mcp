import { NextRequest, NextResponse } from 'next/server';
import { getProductData } from '@/lib/providers/xd-connects/client';
import { db, productProviders } from '@/db';
import { eq } from 'drizzle-orm';

// Helper function to transform XD product data to database format
function transformProductData(product: any) {
  return {
    feedCreatedDateTime: product.FeedCreatedDateTime ? new Date(product.FeedCreatedDateTime) : null,
    itemDataLastModifiedDateTime: product.ItemDataLastModifiedDateTime ? new Date(product.ItemDataLastModifiedDateTime) : null,
    modelCode: product.ModelCode || null,
    itemCode: product.ItemCode || null,
    productLifeCycle: product.ProductLifeCycle || null,
    introDate: product.IntroDate ? new Date(product.IntroDate) : null,
    itemName: product.ItemName || null,
    longDescription: product.LongDescription || null,
    brand: product.Brand || null,
    mainCategory: product.MainCategory || null,
    subCategory: product.SubCategory || null,
    material: product.Material || null,
    color: product.Color || null,
    pmsColor1: product.PMSColor1 || null,
    hexColor1: product.HexColor1 || null,
    itemLengthCM: product.ItemLengthCM?.toString() || null,
    itemWidthCM: product.ItemWidthCM?.toString() || null,
    itemHeightCM: product.ItemHeightCM?.toString() || null,
    itemDimensions: product.ItemDimensions || null,
    itemWeightNetGr: product.ItemWeightNetGr?.toString() || null,
    itemWeightGrossGr: product.ItemWeightGrossGr?.toString() || null,
    countryOfOrigin: product.CountryOfOrigin || null,
    commodityCode: product.CommodityCode || null,
    eanCode: product.EANCode || null,
    packagingTypeItem: product.PackagingTypeItem || null,
    outerCartonLengthCM: product.OuterCartonLengthCM?.toString() || null,
    outerCartonWidthCM: product.OuterCartonWidthCM?.toString() || null,
    outerCartonHeightCM: product.OuterCartonHeightCM?.toString() || null,
    outerCartonDimensions: product.OuterCartonDimensions || null,
    outerCartonWeightNetKG: product.OuterCartonWeightNetKG?.toString() || null,
    outerCartonWeightGrossKG: product.OuterCartonWeightGrossKG?.toString() || null,
    innerboxQty: product.InnerboxQty != null ? Math.round(Number(product.InnerboxQty)) : null,
    outerCartonQty: product.OuterCartonQty != null ? Math.round(Number(product.OuterCartonQty)) : null,
    compliance: product.Compliance || null,
    certifications: product.Certifications || null,
    socialAudits: product.SocialAudits || null,
    eco: product.Eco ?? null,
    traceability: product.Traceability || null,
    charity: product.Charity || null,
    pvcFree: product['PVC free'] ?? null,
    digitalPassport: product['Digital passport'] || null,
    leakPrevention: product['Leak Prevention'] || null,
    totalCO2Emissions: product['Total CO2 emissions']?.toString() || null,
    totalCO2EmissionsBenchmark: product['Total CO2 emissions benchmark']?.toString() || null,
    lcaTotalCO2KgEmissions: product['LCA Total CO2 Kg emissions']?.toString() || null,
    lcaTotalCO2KgEmissionsBenchmark: product['LCA Total CO2 Kg emissions benchmark']?.toString() || null,
    lcaCO2GrMaterialAndProduction: product['LCA CO2 Gr Material and Production']?.toString() || null,
    lcaCO2GrPackaging: product['LCA CO2 Gr Packaging']?.toString() || null,
    lcaCO2GrTransport: product['LCA CO2 Gr Transport']?.toString() || null,
    lcaCO2GrEOL: product['LCA CO2 Gr EOL']?.toString() || null,
    lcaCO2PercentMaterialAndProduction: product['LCA CO2 Percent Material and Production']?.toString() || null,
    lcaCO2PercentPackaging: product['LCA CO2 Percent Packaging']?.toString() || null,
    lcaCO2PercentTransport: product['LCA CO2 Percent Transport']?.toString() || null,
    lcaCO2PercentEOL: product['LCA CO2 Percent EOL']?.toString() || null,
    allImages: product.AllImages || null,
    mainImage: product.MainImage || null,
    mainImageNeutral: product.MainImageNeutral || null,
    extraImage1: product.ExtraImage1 || null,
    extraImage2: product.ExtraImage2 || null,
    extraImage3: product.ExtraImage3 || null,
    imagePrint: product.ImagePrint || null,
    allPrintCodes: product.AllPrintCodes || null,
    printCodeDefault: product.PrintCodeDefault || null,
    printTechniqueDefault: product.PrintTechniqueDefault || null,
    printPositionDefault: product.PrintPositionDefault || null,
    maxPrintWidthDefaultMM: product.MaxPrintWidthDefaultMM != null ? Math.round(Number(product.MaxPrintWidthDefaultMM)) : null,
    maxPrintHeightDefaultMM: product.MaxPrintHeightDefaultMM != null ? Math.round(Number(product.MaxPrintHeightDefaultMM)) : null,
    maxPrintAreaDefault: product.MaxPrintAreaDefault || null,
    maxColorsDefault: product.MaxColorsDefault != null ? Math.round(Number(product.MaxColorsDefault)) : null,
    lineDrawingDefault: product.LineDrawingDefault || null,
    variableDataPrinting: product.VariableDataPrinting ?? null,
    customSleevePossible: product.CustomSleevePossible ?? null,
    giftWrappingPossible: product.GiftWrappingPossible ?? null,
    usp: product.USP || null,
    gpsrContact: product.GPSRContact || null,
    gpsrWebsite: product.GPSRWebsite || null,
    imagefile3D: product.Imagefile3D || null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const data = await getProductData();
    
    // If data is an array, save each product to the database
    if (Array.isArray(data)) {
      const savedProducts = [];
      const errors: Array<{ itemCode: string; error: string }> = [];
      
      for (const product of data) {
        if (!product.ItemCode) {
          console.warn('Skipping product without ItemCode:', product);
          continue;
        }

        try {
          const transformedProduct = transformProductData(product);
          
          // Check if product already exists
          const existing = await db
            .select()
            .from(productProviders)
            .where(eq(productProviders.itemCode, transformedProduct.itemCode!))
            .limit(1);

          if (existing.length > 0) {
            // Update existing product
            const [updated] = await db
              .update(productProviders)
              .set({
                ...transformedProduct,
                updatedAt: new Date(),
              })
              .where(eq(productProviders.itemCode, transformedProduct.itemCode!))
              .returning();
            savedProducts.push(updated);
          } else {
            // Insert new product
            const [inserted] = await db
              .insert(productProviders)
              .values(transformedProduct)
              .returning();
            savedProducts.push(inserted);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Error processing product ${product.ItemCode}:`, errorMessage);
          errors.push({ itemCode: product.ItemCode, error: errorMessage });
        }
      }

      return NextResponse.json({ 
        success: true, 
        data,
        saved: savedProducts.length,
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully saved ${savedProducts.length} products to database${errors.length > 0 ? ` (${errors.length} errors)` : ''}`
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching product data:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

