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

interface ProductRequest {
  id: string;
  productId: string;
  productName: string;
  quantity: string;
  personalizationRemarks: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ProviderQuote {
  id: string;
  providerName: string;
  price: string;
  deliveryDays: number;
  reliabilityScore: string;
  responseTime: number;
}

interface ProductRequestWithQuotes extends ProductRequest {
  quotes?: ProviderQuote[];
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<ProductRequestWithQuotes[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequestQuotes, setSelectedRequestQuotes] = useState<ProviderQuote[] | null>(null);
  const [showQuotesModal, setShowQuotesModal] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    quantity: '',
    personalizationRemarks: ''
  });

  useEffect(() => {
    fetchRequests();
    fetchProducts();
  }, []);

  useEffect(() => {
    // Check for productId in URL params only after products are loaded
    if (products.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const productId = urlParams.get('productId');
      if (productId) {
        const selectedProduct = products.find(p => p.id === productId);
        if (selectedProduct) {
          setFormData({
            productId: productId,
            productName: selectedProduct.name,
            quantity: '',
            personalizationRemarks: ''
          });
          setShowModal(true);
        }
      }
    }
  }, [products]);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/requests');
      const data = await response.json();
      // Ensure data is an array and has the expected structure
      if (Array.isArray(data)) {
        setRequests(data);
      } else {
        console.error('Unexpected data format:', data);
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchQuotes = async (requestId: string): Promise<ProviderQuote[]> => {
    try {
      const response = await fetch(`/api/quotes/${requestId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching quotes:', error);
      return [];
    }
  };

  const handleViewQuotes = async (requestId: string) => {
    const quotes = await fetchQuotes(requestId);
    setSelectedRequestQuotes(quotes);
    setShowQuotesModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const requestData = {
        productId: formData.productId,
        productName: formData.productName,
        quantity: formData.quantity,
        personalizationRemarks: formData.personalizationRemarks || null,
        status: 'pending'
      };

      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const newRequest = await response.json();
        console.log('Request created with quotes:', newRequest);
        setShowModal(false);
        setFormData({ productId: '', productName: '', quantity: '', personalizationRemarks: '' });
        fetchRequests();
      }
    } catch (error) {
      console.error('Error creating request:', error);
    }
  };

  const handleProductChange = (productId: string) => {
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      setFormData({
        ...formData,
        productId: productId,
        productName: selectedProduct.name
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      fulfilled: { color: 'bg-blue-100 text-blue-800', label: 'Fulfilled' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const openCreateModal = () => {
    setFormData({ productId: '', productName: '', quantity: '', personalizationRemarks: '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ productId: '', productName: '', quantity: '', personalizationRemarks: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
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
            📋 Product Requests
          </h1>
          <p className="text-xl text-gray-600">
            Submit and manage your product requests with customizations
          </p>
        </header>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <CardTitle>Product Requests</CardTitle>
                <Badge variant="secondary">{requests.length}</Badge>
              </div>
              <Button onClick={openCreateModal} className="bg-purple-600 hover:bg-purple-700">
                + New Request
              </Button>
            </div>
            <CardDescription>
              Create and track your product requests with personalization details
            </CardDescription>
          </CardHeader>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading requests...</p>
            </CardContent>
          </Card>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-500 text-xl mb-4">No requests found</p>
              <p className="text-gray-400 mb-6">Create your first product request to get started!</p>
              <Button onClick={openCreateModal} className="bg-purple-600 hover:bg-purple-700">
                Create First Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Personalization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.productName}</TableCell>
                      <TableCell className="font-semibold text-purple-600">
                        {request.quantity}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {request.personalizationRemarks || '-'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(request.status)}
                      </TableCell>
                      <TableCell>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewQuotes(request.id)}
                          className="bg-purple-100 text-purple-700 hover:bg-purple-200"
                        >
                          View Quotes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-semibold text-gray-800 mb-6">
                Create New Product Request
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-1">
                    Product *
                  </label>
                  <select
                    id="productId"
                    value={formData.productId}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}{product.price ? ` - $${parseFloat(product.price).toFixed(2)}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    min="1"
                    step="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter quantity"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="personalizationRemarks" className="block text-sm font-medium text-gray-700 mb-1">
                    Personalization Remarks
                  </label>
                  <textarea
                    id="personalizationRemarks"
                    value={formData.personalizationRemarks}
                    onChange={(e) => setFormData({ ...formData, personalizationRemarks: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter any special requirements or customizations"
                    rows={3}
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
                  >
                    Create Request
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Quotes Modal */}
        <Dialog open={showQuotesModal} onOpenChange={setShowQuotesModal}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Provider Quotes</DialogTitle>
              <DialogDescription>
                Compare quotes from different providers for this product request
              </DialogDescription>
            </DialogHeader>
            
            {selectedRequestQuotes && selectedRequestQuotes.length > 0 ? (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Delivery</TableHead>
                      <TableHead>Reliability</TableHead>
                      <TableHead>Response Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedRequestQuotes
                      .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
                      .map((quote, index) => (
                        <TableRow key={quote.id}>
                          <TableCell className="font-medium">
                            {quote.providerName}
                            {index === 0 && (
                              <Badge className="ml-2 bg-green-100 text-green-800">
                                Best Price
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell 
                            className={`font-semibold ${
                              index === 0 ? 'text-green-600' : 'text-gray-900'
                            }`}
                          >
                            ${parseFloat(quote.price).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span>📅</span>
                              <span>{quote.deliveryDays} days</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    parseFloat(quote.reliabilityScore) >= 90 
                                      ? 'bg-green-500' 
                                      : parseFloat(quote.reliabilityScore) >= 80 
                                      ? 'bg-yellow-500' 
                                      : 'bg-red-500'
                                  }`}
                                  style={{ 
                                    width: `${parseFloat(quote.reliabilityScore)}%` 
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm">
                                {parseFloat(quote.reliabilityScore).toFixed(0)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {quote.responseTime}ms
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No quotes available for this request.</p>
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setShowQuotesModal(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
