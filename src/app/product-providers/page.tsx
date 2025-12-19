'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type DigitalAsset = {
  id: string;
  url: string;
  urlHighRes?: string | null;
  type: string;
  subtype?: string | null;
};

type ProductVariant = {
  id: string;
  variantId?: string | null;
  sku?: string | null;
  colorDescription?: string | null;
  colorGroup?: string | null;
  digitalAssets?: DigitalAsset[];
};

type ProductProvider = {
  id: string;
  itemCode: string;
  itemName: string | null;
  brand: string | null;
  mainCategory: string | null;
  subCategory: string | null;
  color: string | null;
  modelCode: string | null;
  productLifeCycle: string | null;
  source?: string | null; // 'midocean' or null (XD Connects)
  originalProductId?: string | null; // For midocean products, reference to products table
  // Midocean-specific fields
  productName?: string | null;
  categoryCode?: string | null;
  productClass?: string | null;
  shortDescription?: string | null;
  longDescription?: string | null;
  imageUrl?: string | null;
  variants?: ProductVariant[];
  digitalAssets?: DigitalAsset[];
  masterCode?: string | null;
  masterId?: string | null;
  dimensions?: string | null;
  material?: string | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
};

type ProductPrice = {
  id: string;
  itemCode: string;
  currency: string | null;
  unitPrice: string | null;
  priceTier1Qty: number | null;
  priceTier1Price: string | null;
  priceTier2Qty: number | null;
  priceTier2Price: string | null;
  priceTier3Qty: number | null;
  priceTier3Price: string | null;
  priceTier4Qty: number | null;
  priceTier4Price: string | null;
  priceTier5Qty: number | null;
  priceTier5Price: string | null;
  minimumOrderQuantity: number | null;
  [key: string]: any;
};

export default function ProductProvidersPage() {
  const [products, setProducts] = useState<ProductProvider[]>([]);
  const [prices, setPrices] = useState<Record<string, ProductPrice>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductProvider | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<ProductPrice | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  // Filter states
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [syncingMidocean, setSyncingMidocean] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Fetch products and prices in parallel
      const [productsResponse, pricesResponse] = await Promise.all([
        fetch('/api/product-providers?limit=1000'),
        fetch('/api/product-prices?limit=1000'),
      ]);

      const productsData = await productsResponse.json();
      const pricesData = await pricesResponse.json();

      if (!productsData.success) {
        throw new Error(productsData.error || 'Failed to fetch products');
      }

      const productsList = productsData.data || [];
      setProducts(productsList);
      
      // Debug: Log product sources to verify they're set correctly
      const midoceanCount = productsList.filter((p: ProductProvider) => p.source === 'midocean').length;
      const xdConnectsCount = productsList.filter((p: ProductProvider) => !p.source || p.source !== 'midocean').length;
      console.log('Products loaded:', {
        total: productsList.length,
        midocean: midoceanCount,
        xdConnects: xdConnectsCount,
        sampleMidocean: productsList.find((p: ProductProvider) => p.source === 'midocean'),
        sampleXD: productsList.find((p: ProductProvider) => !p.source || p.source !== 'midocean'),
      });
      
      // Create a map of itemCode to price
      if (pricesData.success && pricesData.data) {
        const pricesMap: Record<string, ProductPrice> = {};
        pricesData.data.forEach((price: ProductPrice) => {
          pricesMap[price.itemCode] = price;
        });
        setPrices(pricesMap);
        
        // Debug: Log first price to see structure
        if (pricesData.data.length > 0) {
          console.log('Sample price data structure:', pricesData.data[0]);
        }
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProduct = async (product: ProductProvider) => {
    // For Midocean products, fetch full details including variants and digital assets
    if (product.source === 'midocean' && product.originalProductId) {
      try {
        const response = await fetch(`/api/products/${product.originalProductId}`);
        if (response.ok) {
          const productDetails = await response.json();
          // Merge the fetched details with the product provider data
          setSelectedProduct({
            ...product,
            ...productDetails,
            // Keep the product provider fields
            itemCode: product.itemCode,
            itemName: product.itemName,
            mainCategory: product.mainCategory,
            subCategory: product.subCategory,
          });
        } else {
          // Fallback to basic product if fetch fails
          setSelectedProduct(product);
        }
      } catch (error) {
        console.error('Error fetching Midocean product details:', error);
        // Fallback to basic product if fetch fails
        setSelectedProduct(product);
      }
    } else {
      // For XD Connects products, use the product as-is
      setSelectedProduct(product);
    }
    setSelectedPrice(prices[product.itemCode] || null);
    setIsEditMode(false);
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: ProductProvider) => {
    setSelectedProduct(product);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = async (product: ProductProvider) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      // Handle midocean products differently (they're in products table)
      if (product.source === 'midocean' && product.originalProductId) {
        const response = await fetch(`/api/products/${product.originalProductId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete product');
        }
      } else {
        // XD Connects products
        const response = await fetch(`/api/product-providers/${product.id}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to delete product');
        }
      }

      await fetchProducts();
      setDeleteConfirm(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      // Handle midocean products differently (they're in products table)
      if (selectedProduct.source === 'midocean' && selectedProduct.originalProductId) {
        // Transform back to products table format
        const productData = {
          name: selectedProduct.itemName,
          description: selectedProduct.longDescription,
          brand: selectedProduct.brand,
          productCode: selectedProduct.itemCode,
          category: selectedProduct.mainCategory,
          subCategory: selectedProduct.subCategory,
          color: selectedProduct.color,
          material: selectedProduct.material,
          countryOfOrigin: selectedProduct.countryOfOrigin,
          eanCode: selectedProduct.eanCode,
        };

        const response = await fetch(`/api/products/${selectedProduct.originalProductId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update product');
        }
      } else {
        // XD Connects products
        const response = await fetch(`/api/product-providers/${selectedProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(selectedProduct),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to update product');
        }
      }

      await fetchProducts();
      setIsDialogOpen(false);
      setSelectedProduct(null);
      setIsEditMode(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update product');
    }
  };

  // Helper function to extract price from product
  const getProductPrice = (product: ProductProvider): number | null => {
    const price = prices[product.itemCode];
    if (!price) return null;

    const isValidPrice = (val: any) => {
      if (val == null || val === undefined) return false;
      const str = String(val).trim();
      if (str === '' || str === 'null' || str === 'undefined') return false;
      const num = Number(str);
      return !isNaN(num) && num > 0; // Ensure it's a valid positive number
    };

    const extractNumericPrice = (val: any): number | null => {
      if (!isValidPrice(val)) return null;
      const num = Number(String(val).trim());
      return isNaN(num) ? null : num;
    };

    // FIRST: Try parsing rawData - this is where the actual prices are stored for XD Connects
    if (price.rawData) {
      try {
        const raw = typeof price.rawData === 'string' ? JSON.parse(price.rawData) : price.rawData;
        
        // Try to find price in various possible structures - XD Connects format
        let foundPrice = raw.Price || raw.price || raw.UnitPrice || raw.unitPrice || 
                         raw.BasePrice || raw.basePrice || raw.StandardPrice || raw.standardPrice ||
                         raw.ItemPrice || raw.itemPrice;
        
        // Try price tiers - XD Connects might use PriceTiers array
        if (!foundPrice && raw.PriceTiers && Array.isArray(raw.PriceTiers) && raw.PriceTiers.length > 0) {
          // Get the first tier's price
          const firstTier = raw.PriceTiers[0];
          foundPrice = firstTier.Price || firstTier.price || firstTier.UnitPrice || firstTier.unitPrice ||
                       firstTier.ItemPrice || firstTier.itemPrice;
        }
        
        // Try individual tier objects
        if (!foundPrice) {
          foundPrice = raw.PriceTier1?.Price || raw.priceTier1?.price ||
                       raw.PriceTier1?.UnitPrice || raw.priceTier1?.unitPrice ||
                       raw.PriceTier1?.ItemPrice || raw.priceTier1?.itemPrice ||
                       raw.Tier1?.Price || raw.tier1?.price ||
                       raw.Tier1?.UnitPrice || raw.tier1?.unitPrice;
        }
        
        // Try array format
        if (!foundPrice && Array.isArray(raw)) {
          foundPrice = raw[0]?.Price || raw[0]?.price || raw[0]?.UnitPrice || raw[0]?.unitPrice ||
                       raw[0]?.ItemPrice || raw[0]?.itemPrice;
        }
        
        // Try to find any numeric field that might be a price (case-insensitive search)
        if (!foundPrice) {
          for (const key in raw) {
            const keyLower = key.toLowerCase();
            if ((keyLower.includes('price') || keyLower.includes('cost')) && 
                typeof raw[key] === 'number' && raw[key] > 0) {
              foundPrice = raw[key];
              break;
            }
          }
        }
        
        // Also check if PriceTiers is an object with numeric properties
        if (!foundPrice && raw.PriceTiers && typeof raw.PriceTiers === 'object' && !Array.isArray(raw.PriceTiers)) {
          for (const key in raw.PriceTiers) {
            const tierValue = raw.PriceTiers[key];
            if (typeof tierValue === 'number' && tierValue > 0) {
              foundPrice = tierValue;
              break;
            } else if (tierValue && typeof tierValue === 'object') {
              const tierPrice = tierValue.Price || tierValue.price || tierValue.UnitPrice || tierValue.unitPrice;
              if (tierPrice && typeof tierPrice === 'number' && tierPrice > 0) {
                foundPrice = tierPrice;
                break;
              }
            }
          }
        }
        
        if (foundPrice != null && foundPrice !== '') {
          const numPrice = extractNumericPrice(foundPrice);
          if (numPrice !== null) {
            return numPrice;
          }
        }
      } catch (e) {
        console.error('Error parsing rawData for price:', e, price.rawData);
      }
    }

    // Fallback: Check direct database fields (these are usually null for XD Connects)
    const unitPriceFields = ['unitPrice', 'unit_price', 'UnitPrice'];
    for (const field of unitPriceFields) {
      const value = price[field];
      const numPrice = extractNumericPrice(value);
      if (numPrice !== null) {
        return numPrice;
      }
    }

    // Check price tiers in database fields
    const tierFields = [
      ['priceTier1Price', 'price_tier1_price', 'PriceTier1Price'],
      ['priceTier2Price', 'price_tier2_price', 'PriceTier2Price'],
      ['priceTier3Price', 'price_tier3_price', 'PriceTier3Price'],
      ['priceTier4Price', 'price_tier4_price', 'PriceTier4Price'],
      ['priceTier5Price', 'price_tier5_price', 'PriceTier5Price'],
    ];

    for (const tierFieldVariants of tierFields) {
      for (const fieldName of tierFieldVariants) {
        const value = price[fieldName];
        const numPrice = extractNumericPrice(value);
        if (numPrice !== null) {
          return numPrice;
        }
      }
    }

    return null;
  };

  // Extract unique values for filters
  const uniqueColors = Array.from(new Set(products.map(p => p.color).filter(Boolean))).sort();
  const uniqueBrands = Array.from(new Set(products.map(p => p.brand).filter(Boolean))).sort();
  const uniqueCategories = Array.from(new Set(products.map(p => p.mainCategory).filter(Boolean))).sort();

  const filteredProducts = products.filter((product) => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        product.itemCode?.toLowerCase().includes(search) ||
        product.itemName?.toLowerCase().includes(search) ||
        product.brand?.toLowerCase().includes(search) ||
        product.mainCategory?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }

    // Price filter
    if (minPrice || maxPrice) {
      const productPrice = getProductPrice(product);
      
      // Debug logging (remove after fixing)
      if (minPrice && products.indexOf(product) < 5) {
        const priceObj = prices[product.itemCode];
        let rawDataSample = null;
        if (priceObj?.rawData) {
          try {
            rawDataSample = JSON.parse(priceObj.rawData);
          } catch (e) {
            rawDataSample = 'Parse error';
          }
        }
        console.log(`Product ${product.itemCode}:`, {
          hasPriceObj: !!priceObj,
          unitPrice: priceObj?.unitPrice,
          priceTier1Price: priceObj?.priceTier1Price,
          rawDataKeys: rawDataSample && typeof rawDataSample === 'object' ? Object.keys(rawDataSample) : null,
          rawDataSample: rawDataSample,
          extractedPrice: productPrice,
          minPriceFilter: minPrice,
          comparison: productPrice !== null ? `${productPrice} >= ${minPrice}? ${productPrice >= Number(minPrice)}` : 'NO PRICE FOUND'
        });
      }
      
      if (productPrice === null) {
        return false; // Exclude products without price
      }
      
      // Convert filter values to numbers for comparison
      const minPriceNum = minPrice ? Number(minPrice) : null;
      const maxPriceNum = maxPrice ? Number(maxPrice) : null;
      
      // Validate and compare
      if (minPriceNum !== null && !isNaN(minPriceNum) && minPriceNum >= 0) {
        if (productPrice < minPriceNum) {
          return false;
        }
      }
      
      if (maxPriceNum !== null && !isNaN(maxPriceNum) && maxPriceNum >= 0) {
        if (productPrice > maxPriceNum) {
          return false;
        }
      }
    }

    // Color filter
    if (selectedColor && product.color !== selectedColor) return false;

    // Brand filter
    if (selectedBrand && product.brand !== selectedBrand) return false;

    // Category filter
    if (selectedCategory && product.mainCategory !== selectedCategory) return false;

    // Source filter
    if (selectedSource) {
      if (selectedSource === 'midocean') {
        // Only show products where source is explicitly 'midocean'
        if (product.source !== 'midocean') {
          return false;
        }
      } else if (selectedSource === 'xd-connects') {
        // Show products where source is NOT 'midocean' (includes undefined/null for XD Connects)
        if (product.source === 'midocean') {
          return false;
        }
      }
    }

    return true;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, minPrice, maxPrice, selectedColor, selectedBrand, selectedCategory, selectedSource]);

  // Reset filters function
  const resetFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedColor('');
    setSelectedBrand('');
    setSelectedCategory('');
    setSelectedSource('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Sync Midocean products from Test environment
  const handleSyncMidoceanProducts = async () => {
    try {
      setSyncingMidocean(true);
      setError(null);
      
      // Call the Midocean Products API (Test environment)
      const response = await fetch('/api/midocean/product-data?environment=test');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to sync Midocean products`);
      }
      
      if (data.success) {
        const message = `Successfully synced ${data.saved} of ${data.total || 0} Midocean products from Test environment!`;
        console.log('Midocean sync result:', {
          saved: data.saved,
          total: data.total,
          skipped: data.skippedCount || 0,
          errors: data.errorCount || 0,
          skippedItems: data.skipped,
          errorItems: data.errors,
          message: data.message,
        });
        
        let alertMessage = message;
        if (data.skippedCount > 0) {
          alertMessage += `\n\n${data.skippedCount} product(s) were skipped (missing required fields).`;
        }
        if (data.errors && data.errors.length > 0) {
          console.warn('Some products failed to sync:', data.errors);
          alertMessage += `\n\n${data.errorCount || data.errors.length} product(s) had errors. Check console for details.`;
        }
        
        alert(alertMessage);
        
        // Refresh the products list
        await fetchProducts();
      } else {
        throw new Error(data.error || 'Failed to sync Midocean products');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync Midocean products';
      console.error('Error syncing Midocean products:', err);
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setSyncingMidocean(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📦 Product Providers
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Manage products from XD Connects and Midocean
          </p>

          {/* Navigation */}
          <nav className="flex justify-center space-x-4 mb-6 flex-wrap gap-2">
            <Button asChild size="lg" variant="outline">
              <a href="/">👥 Users</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="/products">🛍️ Products</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="/requests">📋 Requests</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="/midocean">🌊 Midocean</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="/xd-connects">🔗 XD Connects</a>
            </Button>
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <a href="/product-providers">📦 Product Providers</a>
            </Button>
          </nav>
        </header>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle>Product Providers List</CardTitle>
                <CardDescription>
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} 
                  {filteredProducts.length !== products.length && ` (${products.length} total)`}
                </CardDescription>
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex items-center gap-2">
                  <Label htmlFor="pageSize" className="text-sm">Items per page:</Label>
                  <select
                    id="pageSize"
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="flex h-9 w-20 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="30">30</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
                <Button 
                  onClick={handleSyncMidoceanProducts} 
                  variant="outline"
                  disabled={syncingMidocean}
                  className="bg-blue-50 hover:bg-blue-100"
                >
                  {syncingMidocean ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Syncing...
                    </>
                  ) : (
                    '🌊 Sync Midocean Products'
                  )}
                </Button>
                <Button onClick={fetchProducts} variant="outline">
                  Refresh
                </Button>
              </div>
            </div>
            
            {/* Filters Section */}
            <div className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Search */}
                <div className="lg:col-span-2">
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {/* Min Price */}
                <div>
                  <Label htmlFor="minPrice">Min Price</Label>
                  <Input
                    id="minPrice"
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    step="0.01"
                  />
                </div>
                
                {/* Max Price */}
                <div>
                  <Label htmlFor="maxPrice">Max Price</Label>
                  <Input
                    id="maxPrice"
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    step="0.01"
                  />
                </div>
                
                {/* Color Filter */}
                <div>
                  <Label htmlFor="color">Color</Label>
                  <select
                    id="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">All Colors</option>
                    {uniqueColors.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Brand Filter */}
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <select
                    id="brand"
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">All Brands</option>
                    {uniqueBrands.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Source Filter */}
                <div>
                  <Label htmlFor="source">Source</Label>
                  <select
                    id="source"
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">All Sources</option>
                    <option value="xd-connects">XD Connects</option>
                    <option value="midocean">Midocean</option>
                  </select>
                </div>
                
                {/* Category Filter */}
                <div className="lg:col-span-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">All Categories</option>
                    {uniqueCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Reset Filters Button */}
                <div className="lg:col-span-3 flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetFilters}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading products...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No products found.</p>
                <p className="text-sm text-gray-500 mt-2">
                  {selectedSource === 'midocean' 
                    ? 'No Midocean products found. Click the "Sync Midocean Products" button above to sync products from Midocean API.'
                    : selectedSource === 'xd-connects'
                    ? 'No XD Connects products found. Try fetching product data from the XD Connects page first.'
                    : 'Try fetching product data from the XD Connects or Midocean pages first.'}
                </p>
                {selectedSource && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-400">
                      Total products in database: {products.length} 
                      ({products.filter((p: ProductProvider) => p.source === 'midocean').length} Midocean, 
                      {products.filter((p: ProductProvider) => !p.source || p.source !== 'midocean').length} XD Connects)
                    </p>
                    {selectedSource === 'midocean' && products.filter((p: ProductProvider) => p.source === 'midocean').length === 0 && (
                      <Button 
                        onClick={handleSyncMidoceanProducts}
                        disabled={syncingMidocean}
                        className="mt-4 bg-blue-600 hover:bg-blue-700"
                      >
                        {syncingMidocean ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Syncing...
                          </>
                        ) : (
                          '🌊 Sync Midocean Products Now'
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Item Code</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Category Code</TableHead>
                      <TableHead>Product Class</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Life Cycle</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          {product.source === 'midocean' ? (
                            <Badge className="bg-blue-600">Midocean</Badge>
                          ) : (
                            <Badge variant="outline">XD Connects</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{product.itemCode}</TableCell>
                        <TableCell>{product.itemName || '-'}</TableCell>
                        <TableCell>{product.productName || '-'}</TableCell>
                        <TableCell>{product.categoryCode || '-'}</TableCell>
                        <TableCell>{product.productClass || '-'}</TableCell>
                        <TableCell>{product.brand || '-'}</TableCell>
                        <TableCell>
                          {product.mainCategory && product.subCategory
                            ? `${product.mainCategory} / ${product.subCategory}`
                            : product.mainCategory || '-'}
                        </TableCell>
                        <TableCell>
                          {product.color ? (
                            <Badge variant="outline">{product.color}</Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const price = prices[product.itemCode];
                            if (!price) {
                              return <span className="text-gray-400">No price</span>;
                            }

                            // Helper to check if a price value is valid
                            const isValidPrice = (val: any) => {
                              if (val == null || val === undefined) return false;
                              const str = String(val).trim();
                              return str !== '' && str !== 'null' && str !== 'undefined' && !isNaN(Number(str));
                            };

                            // Helper to get price value (handles both camelCase and snake_case)
                            const getPriceValue = (priceObj: any, fieldName: string) => {
                              return priceObj[fieldName] || 
                                     priceObj[fieldName.toLowerCase()] ||
                                     priceObj[fieldName.toUpperCase()] ||
                                     // Try snake_case version
                                     priceObj[fieldName.replace(/([A-Z])/g, '_$1').toLowerCase()] ||
                                     // Try with underscores
                                     priceObj[fieldName.split(/(?=[A-Z])/).join('_').toLowerCase()];
                            };

                            // Helper to extract price from rawData
                            const extractPriceFromRaw = (raw: any): { price: string | null; currency: string } => {
                              if (!raw || typeof raw !== 'object') return { price: null, currency: 'EUR' };
                              
                              // Try direct price fields
                              let foundPrice = raw.Price || raw.price || raw.UnitPrice || raw.unitPrice || 
                                             raw.BasePrice || raw.basePrice || raw.StandardPrice || raw.standardPrice;
                              
                              // Try nested structures
                              if (!foundPrice) {
                                foundPrice = raw.PriceTier1?.Price || raw.priceTier1?.price ||
                                           raw.Tier1?.Price || raw.tier1?.price ||
                                           raw.PriceTiers?.[0]?.Price || raw.priceTiers?.[0]?.price;
                              }
                              
                              // Try array format
                              if (!foundPrice && Array.isArray(raw)) {
                                foundPrice = raw[0]?.Price || raw[0]?.price || raw[0]?.UnitPrice || raw[0]?.unitPrice;
                              }
                              
                              // Try to find any numeric field that might be a price
                              if (!foundPrice) {
                                for (const key in raw) {
                                  if ((key.toLowerCase().includes('price') || key.toLowerCase().includes('cost')) && 
                                      typeof raw[key] === 'number' && raw[key] > 0) {
                                    foundPrice = raw[key];
                                    break;
                                  }
                                }
                              }
                              
                              const currency = raw.Currency || raw.currency || raw.CurrencyCode || raw.currencyCode || 'EUR';
                              
                              return {
                                price: foundPrice != null && foundPrice !== '' ? String(foundPrice) : null,
                                currency: String(currency)
                              };
                            };

                            // Try to find a valid price - check all possible field name variations
                            let displayPrice: string | null = null;
                            let currency = price.currency || price.Currency || 'EUR';

                            // List of all possible price field names to check
                            const priceFields = [
                              'unitPrice', 'unit_price', 'UnitPrice', 'unit_price',
                              'priceTier1Price', 'price_tier1_price', 'PriceTier1Price', 'price_tier1_price',
                              'priceTier2Price', 'price_tier2_price', 'PriceTier2Price', 'price_tier2_price',
                              'priceTier3Price', 'price_tier3_price', 'PriceTier3Price', 'price_tier3_price',
                              'priceTier4Price', 'price_tier4_price', 'PriceTier4Price', 'price_tier4_price',
                              'priceTier5Price', 'price_tier5_price', 'PriceTier5Price', 'price_tier5_price',
                            ];

                            // Try each field name
                            for (const fieldName of priceFields) {
                              const value = price[fieldName];
                              if (isValidPrice(value)) {
                                displayPrice = String(value);
                                currency = price.currency || price.Currency || 'EUR';
                                break;
                              }
                            }
                            
                            // Try parsing rawData as fallback if no price found yet
                            if (!displayPrice && price.rawData) {
                              try {
                                const raw = JSON.parse(price.rawData);
                                const extracted = extractPriceFromRaw(raw);
                                if (extracted.price) {
                                  displayPrice = extracted.price;
                                  currency = extracted.currency;
                                }
                              } catch (e) {
                                console.error('Error parsing rawData for price:', e);
                              }
                            }

                            // Debug: Log all price data to understand structure
                            if (!displayPrice) {
                              console.log('Price data for', product.itemCode, ':', {
                                allFields: Object.keys(price),
                                unitPrice: price.unitPrice,
                                unit_price: price.unit_price,
                                priceTier1Price: price.priceTier1Price,
                                price_tier1_price: price.price_tier1_price,
                                currency: price.currency,
                                rawData: price.rawData ? (typeof price.rawData === 'string' ? JSON.parse(price.rawData) : price.rawData) : null
                              });
                            }

                            return (
                              <div className="flex flex-col">
                                {displayPrice ? (
                                  <span className="font-semibold">
                                    {currency} {displayPrice}
                                  </span>
                                ) : (
                                  <span className="text-gray-500">Price available</span>
                                )}
                                {price.minimumOrderQuantity && (
                                  <span className="text-xs text-gray-500">
                                    Min: {price.minimumOrderQuantity}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          {product.productLifeCycle ? (
                            <Badge
                              className={
                                product.productLifeCycle === 'Current'
                                  ? 'bg-green-600'
                                  : 'bg-gray-600'
                              }
                            >
                              {product.productLifeCycle}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewProduct(product)}
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditProduct(product)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteProduct(product)}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className={currentPage === pageNum ? "bg-blue-600 hover:bg-blue-700" : ""}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Detail/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>
                    {isEditMode ? 'Edit Product' : 'Product Details'}
                  </DialogTitle>
                  <DialogDescription>
                    {isEditMode
                      ? 'Update product information'
                      : 'View detailed product information'}
                  </DialogDescription>
                </div>
                {selectedProduct && (
                  <div>
                    {selectedProduct.source === 'midocean' ? (
                      <Badge className="bg-blue-600">Midocean</Badge>
                    ) : (
                      <Badge variant="outline">XD Connects</Badge>
                    )}
                  </div>
                )}
              </div>
            </DialogHeader>

            {selectedProduct && (
              <div className="space-y-4">
                {isEditMode ? (
                  <form onSubmit={handleSaveProduct} className="space-y-4">
                    {selectedProduct.source === 'midocean' && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> This is a Midocean product. Some fields may be limited.
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Item Code</Label>
                        <Input
                          value={selectedProduct.itemCode || ''}
                          onChange={(e) =>
                            setSelectedProduct({
                              ...selectedProduct,
                              itemCode: e.target.value,
                            })
                          }
                          required
                          disabled={selectedProduct.source === 'midocean'}
                        />
                        {selectedProduct.source === 'midocean' && (
                          <p className="text-xs text-gray-500 mt-1">Item code cannot be changed for Midocean products</p>
                        )}
                      </div>
                      <div>
                        <Label>Item Name</Label>
                        <Input
                          value={selectedProduct.itemName || ''}
                          onChange={(e) =>
                            setSelectedProduct({
                              ...selectedProduct,
                              itemName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Brand</Label>
                        <Input
                          value={selectedProduct.brand || ''}
                          onChange={(e) =>
                            setSelectedProduct({
                              ...selectedProduct,
                              brand: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Main Category</Label>
                        <Input
                          value={selectedProduct.mainCategory || ''}
                          onChange={(e) =>
                            setSelectedProduct({
                              ...selectedProduct,
                              mainCategory: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Sub Category</Label>
                        <Input
                          value={selectedProduct.subCategory || ''}
                          onChange={(e) =>
                            setSelectedProduct({
                              ...selectedProduct,
                              subCategory: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Color</Label>
                        <Input
                          value={selectedProduct.color || ''}
                          onChange={(e) =>
                            setSelectedProduct({
                              ...selectedProduct,
                              color: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Long Description</Label>
                      <Textarea
                        value={selectedProduct.longDescription || ''}
                        onChange={(e) =>
                          setSelectedProduct({
                            ...selectedProduct,
                            longDescription: e.target.value,
                          })
                        }
                        rows={4}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Save Changes</Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-500">Item Code</Label>
                        <p className="font-medium">{selectedProduct.itemCode}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Model Code</Label>
                        <p className="font-medium">{selectedProduct.modelCode || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Item Name</Label>
                        <p className="font-medium">{selectedProduct.itemName || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Brand</Label>
                        <p className="font-medium">{selectedProduct.brand || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Main Category</Label>
                        <p className="font-medium">{selectedProduct.mainCategory || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Sub Category</Label>
                        <p className="font-medium">{selectedProduct.subCategory || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Color</Label>
                        <p className="font-medium">{selectedProduct.color || '-'}</p>
                      </div>
                      {selectedProduct.source !== 'midocean' && (
                        <div>
                          <Label className="text-gray-500">Product Life Cycle</Label>
                          <p className="font-medium">{selectedProduct.productLifeCycle || '-'}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-gray-500">Material</Label>
                        <p className="font-medium">{selectedProduct.material || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Country of Origin</Label>
                        <p className="font-medium">{selectedProduct.countryOfOrigin || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">EAN Code</Label>
                        <p className="font-medium">{selectedProduct.eanCode || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Eco</Label>
                        <p className="font-medium">
                          {selectedProduct.eco ? 'Yes' : selectedProduct.eco === false ? 'No' : '-'}
                        </p>
                      </div>
                    </div>
                      {selectedProduct.shortDescription && (
                        <div>
                          <Label className="text-gray-500">Short Description</Label>
                          <p className="mt-1">{selectedProduct.shortDescription}</p>
                        </div>
                      )}
                      {selectedProduct.longDescription && (
                        <div>
                          <Label className="text-gray-500">Long Description</Label>
                          <p className="mt-1">{selectedProduct.longDescription}</p>
                        </div>
                      )}
                      
                      {/* Main Image */}
                      {(selectedProduct.mainImage || selectedProduct.imageUrl) && (
                        <div>
                          <Label className="text-gray-500">Main Image</Label>
                          <img
                            src={selectedProduct.mainImage || selectedProduct.imageUrl}
                            alt={selectedProduct.itemName || 'Product'}
                            className="mt-2 max-w-xs rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      {/* Product Images Gallery for Midocean */}
                      {selectedProduct.source === 'midocean' && selectedProduct.variants && selectedProduct.variants.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-gray-500">Product Images</Label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {selectedProduct.variants.flatMap(variant => 
                              variant.digitalAssets?.filter(asset => asset.type === 'image').map(asset => (
                                <div key={asset.id} className="relative">
                                  <img 
                                    src={asset.urlHighRes || asset.url} 
                                    alt={asset.subtype || 'Product image'}
                                    className="w-full h-48 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                                    onClick={() => window.open(asset.urlHighRes || asset.url, '_blank')}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                  {asset.subtype && (
                                    <p className="text-xs text-gray-500 mt-1 capitalize">
                                      {asset.subtype.replace(/_/g, ' ')}
                                    </p>
                                  )}
                                </div>
                              ))
                            )}
                            {selectedProduct.digitalAssets?.filter(asset => asset.type === 'image').map(asset => (
                              <div key={asset.id} className="relative">
                                <img 
                                  src={asset.urlHighRes || asset.url} 
                                  alt={asset.subtype || 'Product image'}
                                  className="w-full h-48 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                                  onClick={() => window.open(asset.urlHighRes || asset.url, '_blank')}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                                {asset.subtype && (
                                  <p className="text-xs text-gray-500 mt-1 capitalize">
                                    {asset.subtype.replace(/_/g, ' ')}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Midocean-specific fields */}
                      {selectedProduct.source === 'midocean' && (
                        <div className="border-t pt-4 mt-4 space-y-4">
                          <Badge className="bg-blue-600">Midocean Product</Badge>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            {selectedProduct.masterCode && (
                              <div>
                                <Label className="text-gray-500">Master Code</Label>
                                <p className="font-medium">{selectedProduct.masterCode}</p>
                              </div>
                            )}
                            {selectedProduct.dimensions && (
                              <div>
                                <Label className="text-gray-500">Dimensions</Label>
                                <p className="font-medium">{selectedProduct.dimensions}</p>
                              </div>
                            )}
                          </div>

                          {/* Variants */}
                          {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                            <div className="mt-4">
                              <Label className="text-gray-500 mb-2 block">Variants</Label>
                              <div className="space-y-2">
                                {selectedProduct.variants.map((variant) => (
                                  <div key={variant.id} className="border rounded-lg p-3">
                                    <div className="grid md:grid-cols-2 gap-2 text-sm">
                                      {variant.sku && <div><span className="font-medium">SKU:</span> {variant.sku}</div>}
                                      {variant.colorDescription && <div><span className="font-medium">Color:</span> {variant.colorDescription}</div>}
                                      {variant.colorGroup && <div><span className="font-medium">Color Group:</span> {variant.colorGroup}</div>}
                                      {variant.gtin && <div><span className="font-medium">GTIN:</span> {variant.gtin}</div>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Documents */}
                          {selectedProduct.digitalAssets && selectedProduct.digitalAssets.filter(asset => asset.type === 'document').length > 0 && (
                            <div className="mt-4">
                              <Label className="text-gray-500 mb-2 block">Documents</Label>
                              <div className="space-y-2">
                                {selectedProduct.digitalAssets
                                  .filter(asset => asset.type === 'document')
                                  .map(asset => (
                                    <a
                                      key={asset.id}
                                      href={asset.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block p-3 border rounded-lg hover:bg-gray-50 text-sm"
                                    >
                                      <span className="font-medium capitalize">
                                        {asset.subtype ? asset.subtype.replace(/_/g, ' ') : 'Document'}
                                      </span>
                                      <span className="text-gray-500 ml-2">(Click to open)</span>
                                    </a>
                                  ))}
                              </div>
                            </div>
                          )}

                          <p className="text-sm text-gray-500 mt-2">
                            This product is synced from Midocean. Some fields may be read-only.
                          </p>
                        </div>
                      )}
                    
                    {/* Price Information */}
                    {(() => {
                      const price = selectedPrice || prices[selectedProduct.itemCode];
                      if (!price) {
                        return (
                          <div className="border-t pt-4 mt-4">
                            <p className="text-gray-500 text-sm">
                              No pricing information available. 
                              {selectedProduct.source === 'midocean' 
                                ? ' Fetch prices from Midocean pricelist API.'
                                : ' Fetch prices from XD Connects.'}
                            </p>
                          </div>
                        );
                      }

                      // Helper to check if a price value is valid
                      const isValidPrice = (val: any) => {
                        if (val == null || val === undefined) return false;
                        const str = String(val).trim();
                        return str !== '' && str !== 'null' && str !== 'undefined' && !isNaN(Number(str));
                      };

                      // Helper to extract price from rawData
                      const extractPriceFromRaw = (raw: any): { price: string | null; currency: string } => {
                        if (!raw || typeof raw !== 'object') return { price: null, currency: 'EUR' };
                        
                        let foundPrice = raw.Price || raw.price || raw.UnitPrice || raw.unitPrice || 
                                       raw.BasePrice || raw.basePrice || raw.StandardPrice || raw.standardPrice;
                        
                        if (!foundPrice) {
                          foundPrice = raw.PriceTier1?.Price || raw.priceTier1?.price ||
                                     raw.Tier1?.Price || raw.tier1?.price ||
                                     raw.PriceTiers?.[0]?.Price || raw.priceTiers?.[0]?.price;
                        }
                        
                        if (!foundPrice && Array.isArray(raw)) {
                          foundPrice = raw[0]?.Price || raw[0]?.price || raw[0]?.UnitPrice || raw[0]?.unitPrice;
                        }
                        
                        if (!foundPrice) {
                          for (const key in raw) {
                            if ((key.toLowerCase().includes('price') || key.toLowerCase().includes('cost')) && 
                                typeof raw[key] === 'number' && raw[key] > 0) {
                              foundPrice = raw[key];
                              break;
                            }
                          }
                        }
                        
                        const currency = raw.Currency || raw.currency || raw.CurrencyCode || raw.currencyCode || 'EUR';
                        
                        return {
                          price: foundPrice != null && foundPrice !== '' ? String(foundPrice) : null,
                          currency: String(currency)
                        };
                      };

                      // Extract prices using same logic as table
                      const priceFields = [
                        'unitPrice', 'unit_price', 'UnitPrice',
                        'priceTier1Price', 'price_tier1_price', 'PriceTier1Price',
                        'priceTier2Price', 'price_tier2_price', 'PriceTier2Price',
                        'priceTier3Price', 'price_tier3_price', 'PriceTier3Price',
                        'priceTier4Price', 'price_tier4_price', 'PriceTier4Price',
                        'priceTier5Price', 'price_tier5_price', 'PriceTier5Price',
                      ];

                      let displayPrice: string | null = null;
                      let currency = price.currency || price.Currency || 'EUR';

                      for (const fieldName of priceFields) {
                        const value = price[fieldName];
                        if (isValidPrice(value)) {
                          displayPrice = String(value);
                          currency = price.currency || price.Currency || 'EUR';
                          break;
                        }
                      }

                      if (!displayPrice && price.rawData) {
                        try {
                          const raw = JSON.parse(price.rawData);
                          const extracted = extractPriceFromRaw(raw);
                          if (extracted.price) {
                            displayPrice = extracted.price;
                            currency = extracted.currency;
                          }
                        } catch (e) {
                          // Ignore parse errors
                        }
                      }

                      // Extract tier prices
                      const getTierPrice = (tierNum: number) => {
                        const tierFields = [
                          `priceTier${tierNum}Price`,
                          `price_tier${tierNum}_price`,
                          `PriceTier${tierNum}Price`,
                        ];
                        for (const field of tierFields) {
                          const val = price[field];
                          if (isValidPrice(val)) return String(val);
                        }
                        return null;
                      };

                      const getTierQty = (tierNum: number) => {
                        const qtyFields = [
                          `priceTier${tierNum}Qty`,
                          `price_tier${tierNum}_qty`,
                          `PriceTier${tierNum}Qty`,
                        ];
                        for (const field of qtyFields) {
                          const val = price[field];
                          if (val != null && !isNaN(Number(val))) return Number(val);
                        }
                        return null;
                      };

                      const tier1Price = getTierPrice(1);
                      const tier2Price = getTierPrice(2);
                      const tier3Price = getTierPrice(3);
                      const tier4Price = getTierPrice(4);
                      const tier5Price = getTierPrice(5);

                      return (
                        <div className="border-t pt-4 mt-4">
                          <h3 className="text-lg font-semibold mb-3">Pricing Information</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-gray-500">Currency</Label>
                              <p className="font-medium">{currency}</p>
                            </div>
                            {displayPrice && (
                              <div>
                                <Label className="text-gray-500">Unit Price</Label>
                                <p className="font-medium text-lg text-green-600">
                                  {currency} {displayPrice}
                                </p>
                              </div>
                            )}
                            {price.minimumOrderQuantity && (
                              <div>
                                <Label className="text-gray-500">Minimum Order Quantity</Label>
                                <p className="font-medium">{price.minimumOrderQuantity}</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Price Tiers */}
                          {(tier1Price || tier2Price || tier3Price || tier4Price || tier5Price) && (
                            <div className="mt-4">
                              <Label className="text-gray-500 mb-2 block">Price Tiers</Label>
                              <div className="space-y-2">
                                {tier1Price && (
                                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                                    <span>
                                      {getTierQty(1) ? `Qty ${getTierQty(1)}+` : 'Tier 1'}
                                    </span>
                                    <span className="font-medium">
                                      {currency} {tier1Price}
                                    </span>
                                  </div>
                                )}
                                {tier2Price && (
                                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                                    <span>
                                      {getTierQty(2) ? `Qty ${getTierQty(2)}+` : 'Tier 2'}
                                    </span>
                                    <span className="font-medium">
                                      {currency} {tier2Price}
                                    </span>
                                  </div>
                                )}
                                {tier3Price && (
                                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                                    <span>
                                      {getTierQty(3) ? `Qty ${getTierQty(3)}+` : 'Tier 3'}
                                    </span>
                                    <span className="font-medium">
                                      {currency} {tier3Price}
                                    </span>
                                  </div>
                                )}
                                {tier4Price && (
                                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                                    <span>
                                      {getTierQty(4) ? `Qty ${getTierQty(4)}+` : 'Tier 4'}
                                    </span>
                                    <span className="font-medium">
                                      {currency} {tier4Price}
                                    </span>
                                  </div>
                                )}
                                {tier5Price && (
                                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                                    <span>
                                      {getTierQty(5) ? `Qty ${getTierQty(5)}+` : 'Tier 5'}
                                    </span>
                                    <span className="font-medium">
                                      {currency} {tier5Price}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditMode(true);
                        }}
                      >
                        Edit Product
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

