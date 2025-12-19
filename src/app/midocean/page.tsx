'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

type EndpointTab = 'print-pricelist' | 'pricelist' | 'stock' | 'products' | 'order-create' | 'order-detail' | 'printdata';
type Environment = 'test' | 'production';
type Format = 'json' | 'xml' | 'csv';

export default function MidoceanPage() {
  const [activeTab, setActiveTab] = useState<EndpointTab>('print-pricelist');
  const [environment, setEnvironment] = useState<Environment>('test');
  const [format, setFormat] = useState<Format>('json');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Order-specific state
  const [orderId, setOrderId] = useState('');
  const [orderData, setOrderData] = useState('{}');

  const tabs: { id: EndpointTab; label: string; description: string }[] = [
    { id: 'print-pricelist', label: 'Print Pricelist', description: 'Retrieve print prices' },
    { id: 'pricelist', label: 'Pricelist', description: 'Retrieve product prices' },
    { id: 'stock', label: 'Stock', description: 'Retrieve stock levels' },
    { id: 'products', label: 'Products', description: 'Retrieve product information' },
    { id: 'order-create', label: 'Create Order', description: 'Create a new order' },
    { id: 'order-detail', label: 'Order Detail', description: 'Get order tracking information' },
    { id: 'printdata', label: 'Printdata', description: 'Retrieve print information' },
  ];

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      let url = '';
      let options: RequestInit = { method: 'GET' };

      switch (activeTab) {
        case 'print-pricelist':
          url = `/api/midocean/print-pricelist?environment=${environment}&format=${format}`;
          break;
        case 'pricelist':
          url = `/api/midocean/pricelist?environment=${environment}&format=${format}`;
          break;
        case 'stock':
          url = `/api/midocean/stock?environment=${environment}&format=${format}`;
          break;
        case 'products':
          url = `/api/midocean/products?environment=${environment}&format=${format}`;
          break;
        case 'order-create':
          url = `/api/midocean/order/create?environment=${environment}&format=${format}`;
          options.method = 'POST';
          options.headers = { 'Content-Type': 'application/json' };
          try {
            options.body = JSON.stringify(JSON.parse(orderData));
          } catch (e) {
            throw new Error('Invalid JSON in order data');
          }
          break;
        case 'order-detail':
          if (!orderId.trim()) {
            throw new Error('Order ID is required');
          }
          url = `/api/midocean/order/detail?orderId=${encodeURIComponent(orderId)}&environment=${environment}&format=${format}`;
          break;
        case 'printdata':
          url = `/api/midocean/printdata?environment=${environment}&format=${format}`;
          break;
      }

      const res = await fetch(url, options);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Request failed');
      }

      setResponse(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getFormatOptions = (): Format[] => {
    if (activeTab === 'order-create' || activeTab === 'order-detail' || activeTab === 'printdata') {
      return ['json', 'xml'];
    }
    return ['json', 'xml', 'csv'];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🌊 Midocean API Integration
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Interact with Midocean provider APIs
          </p>
          
          {/* Navigation */}
          <nav className="flex justify-center space-x-4 mb-6 flex-wrap gap-2">
            <Button asChild size="lg" variant="outline">
              <a href="/users-management">👥 Users Management</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="/products">🛍️ Products</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="/requests">📋 Requests</a>
            </Button>
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <a href="/midocean">🌊 Midocean</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="/xd-connects">🔗 XD Connects</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="/users-management">👥 Users Management</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="/free-days">📅 Free Days</a>
            </Button>
          </nav>
        </header>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Tabs */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Endpoints</CardTitle>
                <CardDescription>Select an API endpoint</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setResponse(null);
                      setError(null);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-900 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="font-medium">{tab.label}</div>
                    <div className="text-xs text-gray-600 mt-1">{tab.description}</div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>Set API environment and response format</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="environment">Environment</Label>
                    <select
                      id="environment"
                      value={environment}
                      onChange={(e) => setEnvironment(e.target.value as Environment)}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="test">Test</option>
                      <option value="production">Production</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="format">Response Format</Label>
                    <select
                      id="format"
                      value={format}
                      onChange={(e) => setFormat(e.target.value as Format)}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      {getFormatOptions().map((f) => (
                        <option key={f} value={f}>
                          {f.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Endpoint-specific inputs */}
            {(activeTab === 'order-create' || activeTab === 'order-detail') && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {activeTab === 'order-create' ? 'Order Data' : 'Order ID'}
                  </CardTitle>
                  <CardDescription>
                    {activeTab === 'order-create'
                      ? 'Enter order data as JSON'
                      : 'Enter the order ID to retrieve details'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activeTab === 'order-create' ? (
                    <div className="space-y-2">
                      <Label htmlFor="orderData">Order Data (JSON)</Label>
                      <Textarea
                        id="orderData"
                        value={orderData}
                        onChange={(e) => setOrderData(e.target.value)}
                        placeholder='{"productId": "123", "quantity": 10, ...}'
                        rows={8}
                        className="font-mono text-sm"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="orderId">Order ID</Label>
                      <Input
                        id="orderId"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        placeholder="Enter order ID"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Action Button */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  onClick={handleFetch}
                  disabled={loading || (activeTab === 'order-detail' && !orderId.trim())}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Fetching...
                    </>
                  ) : (
                    `Fetch ${tabs.find((t) => t.id === activeTab)?.label}`
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Response */}
            {(response || error) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Response
                    {error ? (
                      <Badge variant="destructive">Error</Badge>
                    ) : (
                      <Badge className="bg-green-600">Success</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {error ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 font-medium">{error}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {format === 'json' ? (
                        <pre className="p-4 bg-gray-900 text-green-400 rounded-lg overflow-auto max-h-96 text-sm font-mono">
                          {JSON.stringify(response, null, 2)}
                        </pre>
                      ) : (
                        <pre className="p-4 bg-gray-900 text-green-400 rounded-lg overflow-auto max-h-96 text-sm font-mono whitespace-pre-wrap">
                          {typeof response === 'string' ? response : JSON.stringify(response, null, 2)}
                        </pre>
                      )}
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (format === 'json') {
                              navigator.clipboard.writeText(JSON.stringify(response, null, 2));
                            } else {
                              navigator.clipboard.writeText(
                                typeof response === 'string' ? response : JSON.stringify(response)
                              );
                            }
                          }}
                        >
                          Copy to Clipboard
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Endpoint Info */}
            <Card>
              <CardHeader>
                <CardTitle>Endpoint Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Current Endpoint:</span>{' '}
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      {tabs.find((t) => t.id === activeTab)?.label}
                    </code>
                  </div>
                  <div>
                    <span className="font-medium">API URL:</span>{' '}
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs break-all">
                      {activeTab === 'print-pricelist' && `${environment === 'test' ? 'https://apitest.midocean.com' : 'https://api.midocean.com'}/gateway/printpricelist/2.0`}
                      {activeTab === 'pricelist' && `${environment === 'test' ? 'https://apitest.midocean.com' : 'https://api.midocean.com'}/gateway/pricelist/2.0`}
                      {activeTab === 'stock' && `${environment === 'test' ? 'https://apitest.midocean.com' : 'https://api.midocean.com'}/gateway/stock/2.0`}
                      {activeTab === 'products' && `${environment === 'test' ? 'https://apitest.midocean.com' : 'https://api.midocean.com'}/gateway/products/2.0?language=en`}
                      {activeTab === 'order-create' && `${environment === 'test' ? 'https://apitest.midocean.com' : 'https://api.midocean.com'}/gateway/order/2.1/create`}
                      {activeTab === 'order-detail' && `${environment === 'test' ? 'https://apitest.midocean.com' : 'https://api.midocean.com'}/gateway/order/2.1/detail`}
                      {activeTab === 'printdata' && `${environment === 'test' ? 'https://apitest.midocean.com' : 'https://api.midocean.com'}/gateway/printdata/1.0`}
                    </code>
                  </div>
                  <div>
                    <span className="font-medium">Environment:</span>{' '}
                    <Badge variant={environment === 'test' ? 'secondary' : 'default'}>
                      {environment}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Format:</span>{' '}
                    <Badge>{format.toUpperCase()}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

