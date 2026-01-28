'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getXDConnectsConfig } from '@/lib/providers/xd-connects/config';

type EndpointTab = 'product-data' | 'product-prices' | 'print-data' | 'print-prices' | 'stock';

interface LastSyncInfo {
  syncedAt: Date | string;
  recordCount?: number | null;
  success: boolean;
}

export default function XDConnectsPage({ embedded = false }: { embedded?: boolean }) {
  const [activeTab, setActiveTab] = useState<EndpointTab>('product-data');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncDates, setLastSyncDates] = useState<Record<string, LastSyncInfo>>({});

  const config = getXDConnectsConfig();

  // Fetch last sync dates on component mount
  useEffect(() => {
    fetchLastSyncDates();
  }, []);

  const fetchLastSyncDates = async () => {
    try {
      console.log('Fetching XD Connects last sync dates...');
      const res = await fetch('/api/xd-connects/sync-history');
      const data = await res.json();
      console.log('XD Connects sync history response:', { status: res.status, ok: res.ok, data });
      if (data.success && data.data) {
        console.log('Setting last sync dates:', data.data);
        setLastSyncDates(data.data);
      } else {
        console.warn('Failed to fetch sync history:', data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching last sync dates:', err);
    }
  };

  const tabs: { id: EndpointTab; label: string; description: string; feedUrl: string }[] = [
    {
      id: 'product-data',
      label: 'Product Data',
      description: 'Retrieve product information',
      feedUrl: config.feeds.productData,
    },
    {
      id: 'product-prices',
      label: 'Product Prices',
      description: 'Retrieve product pricing information',
      feedUrl: config.feeds.productPrices,
    },
    {
      id: 'print-data',
      label: 'Print Data',
      description: 'Retrieve print information',
      feedUrl: config.feeds.printData,
    },
    {
      id: 'print-prices',
      label: 'Print Prices',
      description: 'Retrieve print pricing information',
      feedUrl: config.feeds.printPrices,
    },
    {
      id: 'stock',
      label: 'Stock',
      description: 'Retrieve stock levels',
      feedUrl: config.feeds.stock,
    },
  ];

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      let url = '';

      switch (activeTab) {
        case 'product-data':
          url = '/api/xd-connects/product-data';
          break;
        case 'product-prices':
          url = '/api/xd-connects/product-prices';
          break;
        case 'print-data':
          url = '/api/xd-connects/print-data';
          break;
        case 'print-prices':
          url = '/api/xd-connects/print-prices';
          break;
        case 'stock':
          url = '/api/xd-connects/stock';
          break;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) {
        // Save failed sync to history
        await saveSyncHistory(activeTab, null, false, data.error || 'Request failed');
        throw new Error(data.error || 'Request failed');
      }

      // Determine record count
      const recordCount = Array.isArray(data.data) ? data.data.length : 
                         (typeof data.data === 'object' && data.data !== null ? 1 : 0);

      // Save successful sync to history
      await saveSyncHistory(activeTab, recordCount, true, null);

      // Refresh last sync dates
      await fetchLastSyncDates();

      setResponse(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveSyncHistory = async (
    feedType: EndpointTab,
    recordCount: number | null,
    success: boolean,
    errorMessage: string | null
  ) => {
    try {
      console.log('Saving XD Connects sync history:', { feedType, recordCount, success, errorMessage });
      const res = await fetch('/api/xd-connects/sync-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedType,
          recordCount,
          success,
          errorMessage,
        }),
      });
      
      const data = await res.json();
      console.log('XD Connects sync history API response:', { status: res.status, ok: res.ok, data });
      
      if (!res.ok || !data.success) {
        console.error('Error saving XD Connects sync history:', {
          status: res.status,
          error: data.error || 'Unknown error',
          response: data
        });
      } else {
        console.log('XD Connects sync history saved successfully:', data.data);
      }
    } catch (err) {
      console.error('Error saving XD Connects sync history (catch):', err);
    }
  };

  const formatLastSyncDate = (feedType: EndpointTab): string => {
    const lastSync = lastSyncDates[feedType];
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

  const activeTabInfo = tabs.find((t) => t.id === activeTab);

  return (
    <div className={embedded ? "p-8" : "min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8"}>
      <div className="max-w-7xl mx-auto">
        {!embedded && (
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🔗 XD Connects Integration
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Access XD Connects product feeds and data
            </p>
            
            {/* Navigation */}
            <nav className="flex justify-center space-x-4 mb-6 flex-wrap gap-2">
              <Button asChild size="lg" variant="outline">
                <a href="/">🏠 Home</a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="/users-management">👥 Users Management</a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="/midocean">🌊 Midocean</a>
              </Button>
              <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
                <a href="/xd-connects">🔗 XD Connects</a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="/product-providers">📦 Product Providers</a>
              </Button>
            </nav>
          </header>
        )}

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Tabs */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Feeds</CardTitle>
                <CardDescription>Select a data feed</CardDescription>
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
                          ? 'bg-purple-100 text-purple-900 border-2 border-purple-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="font-medium">{tab.label}</div>
                      <div className="text-xs text-gray-600 mt-1">{tab.description}</div>
                      {lastSync && (
                        <div className="text-xs mt-1">
                          <span className={`${lastSync.success ? 'text-green-600' : 'text-red-600'}`}>
                            Last sync: {formatLastSyncDate(tab.id)}
                          </span>
                          {lastSync.recordCount !== null && lastSync.recordCount !== undefined && (
                            <span className="text-gray-500 ml-1">
                              ({lastSync.recordCount} records)
                            </span>
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
            {/* Action Button */}
            <Card>
              <CardHeader>
                <CardTitle>{activeTabInfo?.label}</CardTitle>
                <CardDescription>{activeTabInfo?.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {lastSyncDates[activeTab] ? (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
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
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-500">No sync history available</span>
                  </div>
                )}
                <Button
                  onClick={handleFetch}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Fetching...
                    </>
                  ) : (
                    `Fetch ${activeTabInfo?.label}`
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
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">
                          {Array.isArray(response)
                            ? `Array with ${response.length} items`
                            : typeof response === 'object'
                            ? 'Object data'
                            : 'Data received'}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(response, null, 2));
                          }}
                        >
                          Copy to Clipboard
                        </Button>
                      </div>
                      <pre className="p-4 bg-gray-900 text-green-400 rounded-lg overflow-auto max-h-96 text-sm font-mono">
                        {JSON.stringify(response, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Feed Info */}
            <Card>
              <CardHeader>
                <CardTitle>Feed Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium">Current Feed:</span>{' '}
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      {activeTabInfo?.label}
                    </code>
                  </div>
                  <div>
                    <span className="font-medium">Feed URL:</span>
                    <div className="mt-1">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs break-all block">
                        {activeTabInfo?.feedUrl}
                      </code>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Format:</span>{' '}
                    <Badge>JSON</Badge>
                  </div>
                  <div>
                    <span className="font-medium">Method:</span>{' '}
                    <Badge variant="secondary">GET</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Preview */}
            {response && (
              <Card>
                <CardHeader>
                  <CardTitle>Data Preview</CardTitle>
                  <CardDescription>
                    Quick preview of the fetched data structure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {Array.isArray(response) ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        This is an array with <strong>{response.length}</strong> items.
                      </p>
                      {response.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">First item structure:</p>
                          <pre className="p-3 bg-gray-50 rounded-lg overflow-auto text-xs font-mono max-h-48">
                            {JSON.stringify(response[0], null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : typeof response === 'object' ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        This is an object with the following keys:
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.keys(response).map((key) => (
                          <Badge key={key} variant="outline">
                            {key}
                          </Badge>
                        ))}
                      </div>
                      {Object.keys(response).length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Sample data:</p>
                          <pre className="p-3 bg-gray-50 rounded-lg overflow-auto text-xs font-mono max-h-48">
                            {JSON.stringify(
                              Object.fromEntries(Object.entries(response).slice(0, 3)),
                              null,
                              2
                            )}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Data type: {typeof response}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

