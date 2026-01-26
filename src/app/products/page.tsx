'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DigitalAsset {
  id: string;
  url: string;
  urlHighRes?: string | null;
  type: string;
  subtype?: string | null;
}

interface ProductVariant {
  id: string;
  variantId?: string | null;
  sku?: string | null;
  colorDescription?: string | null;
  colorGroup?: string | null;
  digitalAssets?: DigitalAsset[];
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  source?: string | null;
  brand?: string | null;
  productCode?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  shortDescription?: string | null;
  longDescription?: string | null;
  material?: string | null;
  dimensions?: string | null;
  masterCode?: string | null;
  masterId?: string | null;
  variants?: ProductVariant[];
  digitalAssets?: DigitalAsset[];
  createdAt: string;
  updatedAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: formData.price
      };

      let response;
      if (editingProduct) {
        // Update existing product
        response = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
      } else {
        // Create new product
        response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
      }

      if (response.ok) {
        setShowModal(false);
        setEditingProduct(null);
        setFormData({ name: '', description: '', price: '' });
        fetchProducts();
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleView = async (product: Product) => {
    try {
      const response = await fetch(`/api/products/${product.id}`);
      if (response.ok) {
        const productDetails = await response.json();
        // Debug logging for image data
        console.log('Product details fetched:', {
          id: productDetails.id,
          name: productDetails.name,
          imageUrl: productDetails.imageUrl,
          variantsCount: productDetails.variants?.length || 0,
          variants: productDetails.variants?.map((v: any) => ({
            id: v.id,
            variantId: v.variantId,
            sku: v.sku,
            digitalAssetsCount: v.digitalAssets?.length || 0,
            digitalAssets: v.digitalAssets?.map((a: any) => ({
              id: a.id,
              type: a.type,
              subtype: a.subtype,
              url: a.url,
              urlHighRes: a.urlHighRes,
            })),
          })),
          masterDigitalAssetsCount: productDetails.digitalAssets?.length || 0,
          masterDigitalAssets: productDetails.digitalAssets?.map((a: any) => ({
            id: a.id,
            type: a.type,
            subtype: a.subtype,
            url: a.url,
            urlHighRes: a.urlHighRes,
          })),
        });
        setViewingProduct(productDetails);
        setShowViewModal(true);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Button asChild variant="outline">
              <a href="/">
                ← Back to Home
              </a>
            </Button>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🛍️ Products Management
          </h1>
          <p className="text-xl text-gray-600">
            Manage your product catalog with full CRUD operations
          </p>
        </header>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <CardTitle>Products</CardTitle>
                <Badge variant="secondary">{products.length}</Badge>
              </div>
              <Button onClick={openCreateModal} className="bg-green-600 hover:bg-green-700">
                + Add Product
              </Button>
            </div>
            <CardDescription>
              Create, edit, and manage your product catalog
            </CardDescription>
          </CardHeader>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </CardContent>
          </Card>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-500 text-xl mb-4">No products found</p>
              <p className="text-gray-400 mb-6">Create your first product to get started!</p>
              <Button onClick={openCreateModal} className="bg-green-600 hover:bg-green-700">
                Create First Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Brand/Source</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        {product.brand && <Badge variant="outline">{product.brand}</Badge>}
                        {product.source && (
                          <Badge className="ml-1" variant="secondary">{product.source}</Badge>
                        )}
                        {!product.brand && !product.source && '-'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {product.description || '-'}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {product.price ? `$${parseFloat(product.price).toFixed(2)}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {new Date(product.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(product)}
                            className="bg-blue-100 text-blue-700 hover:bg-blue-200"
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/requests?productId=${product.id}`, '_blank')}
                            className="bg-purple-100 text-purple-700 hover:bg-purple-200"
                          >
                            Request
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Edit/Create Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Create New Product'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct 
                  ? 'Update the product information below.' 
                  : 'Add a new product to your catalog.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  type="number"
                  id="price"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00 (optional)"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </Button>
                <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Product Modal */}
        <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewingProduct?.name}</DialogTitle>
              <DialogDescription>
                {viewingProduct?.shortDescription || viewingProduct?.description || 'Product details'}
              </DialogDescription>
            </DialogHeader>
            
            {viewingProduct && (
              <div className="space-y-6">
                {/* Main Image */}
                {viewingProduct.imageUrl && (
                  <div className="w-full">
                    <img 
                      src={viewingProduct.imageUrl} 
                      alt={viewingProduct.name}
                      className="w-full h-auto rounded-lg border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Product Images Gallery */}
                {(() => {
                  // Collect all images from variants and master-level
                  const variantImages = viewingProduct.variants?.flatMap(variant => 
                    variant.digitalAssets?.filter(asset => asset.type === 'image') || []
                  ) || [];
                  const masterImages = viewingProduct.digitalAssets?.filter(asset => asset.type === 'image') || [];
                  const allImages = [...variantImages, ...masterImages];
                  
                  // Show gallery if there are any images
                  if (allImages.length > 0) {
                    return (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Product Images</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {allImages.map(asset => (
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
                              {asset.url && (
                                <p className="text-xs text-gray-400 mt-1 truncate" title={asset.url}>
                                  {asset.url.length > 50 ? asset.url.substring(0, 50) + '...' : asset.url}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Product Information */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    <div className="space-y-1 text-sm">
                      {viewingProduct.masterCode && (
                        <div><span className="font-medium">Master Code:</span> {viewingProduct.masterCode}</div>
                      )}
                      {viewingProduct.productCode && (
                        <div><span className="font-medium">Product Code:</span> {viewingProduct.productCode}</div>
                      )}
                      {viewingProduct.brand && (
                        <div><span className="font-medium">Brand:</span> {viewingProduct.brand}</div>
                      )}
                      {viewingProduct.category && (
                        <div><span className="font-medium">Category:</span> {viewingProduct.category}</div>
                      )}
                      {viewingProduct.productClass && (
                        <div><span className="font-medium">Product Class:</span> {viewingProduct.productClass}</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Descriptions</h3>
                    <div className="space-y-1 text-sm">
                      {viewingProduct.shortDescription && (
                        <div>
                          <span className="font-medium">Short Description:</span>
                          <p className="mt-1">{viewingProduct.shortDescription}</p>
                        </div>
                      )}
                      {viewingProduct.longDescription && (
                        <div>
                          <span className="font-medium">Long Description:</span>
                          <p className="mt-1">{viewingProduct.longDescription}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dimensions & Weight */}
                {(viewingProduct.dimensions || viewingProduct.length || viewingProduct.width || viewingProduct.height) && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Dimensions & Weight</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      {viewingProduct.dimensions && (
                        <div><span className="font-medium">Dimensions:</span> {viewingProduct.dimensions}</div>
                      )}
                      {viewingProduct.length && (
                        <div>
                          <span className="font-medium">Length:</span> {viewingProduct.length} {viewingProduct.lengthUnit || 'cm'}
                        </div>
                      )}
                      {viewingProduct.width && (
                        <div>
                          <span className="font-medium">Width:</span> {viewingProduct.width} {viewingProduct.widthUnit || 'cm'}
                        </div>
                      )}
                      {viewingProduct.height && (
                        <div>
                          <span className="font-medium">Height:</span> {viewingProduct.height} {viewingProduct.heightUnit || 'cm'}
                        </div>
                      )}
                      {viewingProduct.volume && (
                        <div>
                          <span className="font-medium">Volume:</span> {viewingProduct.volume} {viewingProduct.volumeUnit || ''}
                        </div>
                      )}
                      {viewingProduct.netWeight && (
                        <div>
                          <span className="font-medium">Net Weight:</span> {viewingProduct.netWeight} {viewingProduct.netWeightUnit || 'kg'}
                        </div>
                      )}
                      {viewingProduct.grossWeight && (
                        <div>
                          <span className="font-medium">Gross Weight:</span> {viewingProduct.grossWeight} {viewingProduct.grossWeightUnit || 'kg'}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Material & Packaging */}
                {(viewingProduct.material || viewingProduct.packagingAfterPrinting || viewingProduct.printable) && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Material & Packaging</h3>
                    <div className="text-sm space-y-1">
                      {viewingProduct.material && (
                        <div><span className="font-medium">Material:</span> {viewingProduct.material}</div>
                      )}
                      {viewingProduct.packagingAfterPrinting && (
                        <div><span className="font-medium">Packaging After Printing:</span> {viewingProduct.packagingAfterPrinting}</div>
                      )}
                      {viewingProduct.printable && (
                        <div><span className="font-medium">Printable:</span> {viewingProduct.printable}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Variants */}
                {viewingProduct.variants && viewingProduct.variants.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Variants</h3>
                    <div className="space-y-3">
                      {viewingProduct.variants.map((variant) => (
                        <div key={variant.id} className="border rounded-lg p-4">
                          <div className="grid md:grid-cols-2 gap-2 text-sm">
                            {variant.sku && <div><span className="font-medium">SKU:</span> {variant.sku}</div>}
                            {variant.colorDescription && <div><span className="font-medium">Color:</span> {variant.colorDescription}</div>}
                            {variant.colorGroup && <div><span className="font-medium">Color Group:</span> {variant.colorGroup}</div>}
                            {variant.gtin && <div><span className="font-medium">GTIN:</span> {variant.gtin}</div>}
                            {variant.plcStatusDescription && (
                              <div><span className="font-medium">Status:</span> {variant.plcStatusDescription}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents */}
                {viewingProduct.digitalAssets && viewingProduct.digitalAssets.filter(asset => asset.type === 'document').length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Documents</h3>
                    <div className="space-y-2">
                      {viewingProduct.digitalAssets
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
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
