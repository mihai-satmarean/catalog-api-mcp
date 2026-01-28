'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

type EndpointTab = 'print-pricelist' | 'pricelist' | 'stock' | 'products' | 'order-create' | 'order-detail' | 'printdata';
type Environment = 'test' | 'production';
type Format = 'json' | 'xml' | 'csv';

interface LastSyncInfo {
  syncedAt: Date | string;
  recordCount?: number | null;
  success: boolean;
  statusMessage?: string | null;
}

export default function MidoceanPage({ embedded = false }: { embedded?: boolean }) {
  const [activeTab, setActiveTab] = useState<EndpointTab>('print-pricelist');
  const [environment, setEnvironment] = useState<Environment>('test');
  const [format, setFormat] = useState<Format>('json');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncDates, setLastSyncDates] = useState<Record<string, LastSyncInfo>>({});
  
  // Order-specific state
  const [orderId, setOrderId] = useState('');
  const [orderData, setOrderData] = useState('{}');

  // Fetch last sync dates on component mount and when environment changes
  useEffect(() => {
    fetchLastSyncDates();
  }, [environment]);

  const fetchLastSyncDates = async () => {
    try {
      const res = await fetch(`/api/midocean/sync-history?environment=${environment}`);
      const data = await res.json();
      if (data.success && data.data) {
        setLastSyncDates(data.data);
      }
    } catch (err) {
      console.error('Error fetching last sync dates:', err);
    }
  };

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
      
      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error('Failed to parse response as JSON:', jsonErr);
        const text = await res.text();
        console.error('Response text:', text);
        throw new Error('Invalid response format');
      }

      if (!res.ok || !data.success) {
        // Save failed sync to history
        try {
          await saveSyncHistory(activeTab, environment, null, false, data.error || 'Request failed', null);
        } catch (syncErr) {
          console.error('Failed to save failed sync history:', syncErr);
        }
        throw new Error(data.error || 'Request failed');
      }

      // Extract STATUS_TEXT from PRICELIST_RESPONSE if present (for pricelist and print-pricelist endpoints)
      let statusMessage: string | null = null;
      if (data.data && typeof data.data === 'object') {
        // Check for PRICELIST_RESPONSE structure (used by pricelist and print-pricelist)
        if (data.data.PRICELIST_RESPONSE?.STATUS_TEXT) {
          statusMessage = data.data.PRICELIST_RESPONSE.STATUS_TEXT;
        } 
        // Also check for PRINT_PRICELIST_RESPONSE structure (if different)
        else if (data.data.PRINT_PRICELIST_RESPONSE?.STATUS_TEXT) {
          statusMessage = data.data.PRINT_PRICELIST_RESPONSE.STATUS_TEXT;
        }
        // Fallback to direct statusMessage field
        else if (data.data.statusMessage) {
          statusMessage = data.data.statusMessage;
        }
        // Check nested structures
        else if (data.data.response?.STATUS_TEXT) {
          statusMessage = data.data.response.STATUS_TEXT;
        }
      }

      // Determine record count
      const recordCount = Array.isArray(data.data) ? data.data.length : 
                         (typeof data.data === 'object' && data.data !== null ? 1 : 0);

      // Save successful sync to history
      try {
        await saveSyncHistory(activeTab, environment, recordCount, true, null, statusMessage);
        // Refresh last sync dates after saving
        await fetchLastSyncDates();
      } catch (syncErr) {
        console.error('Failed to save sync history:', syncErr);
        // Don't fail the whole operation if sync history save fails
      }

      setResponse(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveSyncHistory = async (
    endpointType: EndpointTab,
    environment: Environment,
    recordCount: number | null,
    success: boolean,
    errorMessage: string | null,
    statusMessage: string | null = null
  ) => {
    try {
      console.log('Saving sync history:', { endpointType, environment, recordCount, success });
      const res = await fetch('/api/midocean/sync-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpointType,
          environment,
          recordCount,
          success,
          errorMessage,
          statusMessage,
        }),
      });
      
      const data = await res.json();
      console.log('Sync history API response:', { status: res.status, ok: res.ok, data });
      
      if (!res.ok || !data.success) {
        console.error('Error saving sync history:', {
          status: res.status,
          error: data.error || 'Unknown error',
          response: data
        });
      } else {
        console.log('Sync history saved successfully:', data.data);
      }
    } catch (err) {
      console.error('Error saving sync history (catch):', err);
    }
  };

  const formatLastSyncDate = (endpointType: EndpointTab): string => {
    const lastSync = lastSyncDates[endpointType];
    if (!lastSync) {
      return 'Never synced';
    }

    const syncedAt = lastSync.syncedAt instanceof Date 
      ? lastSync.syncedAt 
      : new Date(lastSync.syncedAt);
    
    const now = new Date();
    const diffMs = now.getTime() - syncedAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return syncedAt.toLocaleDateString() + ' ' + syncedAt.toLocaleTimeString();
    }
  };

  const getFormatOptions = (): Format[] => {
    if (activeTab === 'order-create' || activeTab === 'order-detail' || activeTab === 'printdata') {
      return ['json', 'xml'];
    }
    return ['json', 'xml', 'csv'];
  };

  return (
    <div className={embedded ? "p-8" : "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8"}>
      <div className="max-w-7xl mx-auto">
        {!embedded && (
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
                <a href="/">🏠 Home</a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="/users-management">👥 Users Management</a>
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
        )}

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Tabs */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Endpoints</CardTitle>
                <CardDescription>Select an API endpoint</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {tabs.map((tab) => {
                  const lastSync = lastSyncDates[tab.id];
                  return (
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
                      {lastSync && (
                        <div className="text-xs mt-1 space-y-1">
                          <div>
                            <span className={`${lastSync.success ? 'text-green-600' : 'text-red-600'}`}>
                              Last sync: {formatLastSyncDate(tab.id)}
                            </span>
                            {lastSync.recordCount !== null && lastSync.recordCount !== undefined && (
                              <span className="text-gray-500 ml-1">
                                ({lastSync.recordCount} records)
                              </span>
                            )}
                          </div>
                          {lastSync.statusMessage && (
                            <div className="text-yellow-600 italic">
                              {lastSync.statusMessage}
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
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
              <CardContent className="pt-6 space-y-4">
                {lastSyncDates[activeTab] ? (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Last sync:</span>
                        <span className={`text-sm font-medium ${
                          lastSyncDates[activeTab].success ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatLastSyncDate(activeTab)}
                        </span>
                        {lastSyncDates[activeTab].recordCount !== null && 
                         lastSyncDates[activeTab].recordCount !== undefined && (
                          <span className="text-xs text-gray-500">
                            ({lastSyncDates[activeTab].recordCount} records)
                          </span>
                        )}
                      </div>
                      {lastSyncDates[activeTab].success ? (
                        <Badge className="bg-green-600">Success</Badge>
                      ) : (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </div>
                    {lastSyncDates[activeTab].statusMessage && (
                      <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200 italic">
                        {lastSyncDates[activeTab].statusMessage}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-500">No sync history available</span>
                  </div>
                )}
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

