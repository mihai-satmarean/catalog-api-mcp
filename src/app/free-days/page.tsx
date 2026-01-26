'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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

interface User {
  id: string;
  name: string;
  email: string;
}

interface FreeDayRequest {
  id: string;
  userId: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export default function FreeDaysPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<FreeDayRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    userId: '',
    type: 'concediu',
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchRequests();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/free-day-requests');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setRequests(data.data);
      } else {
        setError('Failed to fetch requests');
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      
      if (!formData.userId || !formData.startDate || !formData.endDate) {
        setError('Please fill in all required fields');
        return;
      }

      const response = await fetch('/api/free-day-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: formData.userId,
          type: formData.type,
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFormData({
          userId: '',
          type: 'concediu',
          startDate: '',
          endDate: '',
          reason: '',
        });
        setIsFormOpen(false);
        await fetchRequests();
      } else {
        setError(data.error || 'Failed to create request');
      }
    } catch (err) {
      console.error('Error creating request:', err);
      setError(err instanceof Error ? err.message : 'Failed to create request');
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      concediu: 'Concediu',
      sanatate: 'Sănătate',
      birthdata: 'Ziua de naștere',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-600',
      approved: 'bg-green-600',
      rejected: 'bg-red-600',
    };
    return (
      <Badge className={variants[status] || 'bg-gray-600'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📅 Free Days Requests
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Request and manage free days
          </p>

          {/* Navigation */}
          <nav className="flex justify-center space-x-4 mb-6 flex-wrap gap-2">
            <Button asChild size="lg" variant="outline">
              <a href="/">🏠 Home</a>
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
            <Button asChild size="lg" variant="outline">
              <a href="/product-providers">📦 Product Providers</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="/users-management">👥 Users Management</a>
            </Button>
            <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
              <a href="/free-days">📅 Free Days</a>
            </Button>
          </nav>
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Request Form Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Request Free Days</CardTitle>
                <CardDescription>
                  Submit a new free day request
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setIsFormOpen(true)}
                  className="w-full"
                  size="lg"
                >
                  + New Request
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Requests List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Free Day Requests</CardTitle>
                    <CardDescription>
                      {requests.length} request{requests.length !== 1 ? 's' : ''} total
                    </CardDescription>
                  </div>
                  <Button onClick={fetchRequests} variant="outline">
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading requests...</p>
                  </div>
                ) : error ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 font-medium">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchRequests}
                      className="mt-2"
                    >
                      Retry
                    </Button>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No requests found.</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Click "New Request" to create your first free day request.
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">
                              {request.user?.name || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              {getTypeLabel(request.type)}
                            </TableCell>
                            <TableCell>
                              {new Date(request.startDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {new Date(request.endDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(request.status)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Request Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Request Free Days</DialogTitle>
              <DialogDescription>
                Fill in the form to request free days
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="userId">User *</Label>
                <select
                  id="userId"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type of Free Day *</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="concediu">Concediu</option>
                  <option value="sanatate">Sănătate</option>
                  <option value="birthdata">Ziua de naștere</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    type="date"
                    id="startDate"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    type="date"
                    id="endDate"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Enter reason for free days request"
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsFormOpen(false);
                    setFormData({
                      userId: '',
                      type: 'concediu',
                      startDate: '',
                      endDate: '',
                      reason: '',
                    });
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Submit Request</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

