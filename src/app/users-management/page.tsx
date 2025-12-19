'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface User {
  id: string;
  email: string;
  name: string;
  roleId: string | null;
  role: Role | null;
  createdAt: string;
  updatedAt: string;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', roleId: '' });
  const [error, setError] = useState<string | null>(null);
  const [updatingRoles, setUpdatingRoles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadData = async () => {
      await initializeRoles();
      await fetchRoles();
      await fetchUsers();
    };
    loadData();
  }, []);

  const initializeRoles = async () => {
    try {
      const response = await fetch('/api/roles/init', { method: 'POST' });
      const data = await response.json();
      if (!data.success) {
        console.error('Failed to initialize roles:', data.error);
      }
    } catch (err) {
      console.error('Error initializing roles:', err);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      const data = await response.json();
      console.log('Roles API response:', data);
      if (data.success && Array.isArray(data.data)) {
        console.log('Setting roles:', data.data);
        setRoles(data.data);
      } else {
        console.error('Failed to fetch roles:', data);
        // If roles don't exist, try initializing and fetching again
        if (data.data && data.data.length === 0) {
          await initializeRoles();
          // Wait a bit then retry
          setTimeout(async () => {
            const retryResponse = await fetch('/api/roles');
            const retryData = await retryResponse.json();
            if (retryData.success && Array.isArray(retryData.data)) {
              setRoles(retryData.data);
            }
          }, 500);
        }
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/users');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setError('Failed to fetch users');
        setUsers([]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const userData = {
        name: newUser.name,
        email: newUser.email,
        roleId: newUser.roleId || null,
      };
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (response.ok) {
        setNewUser({ name: '', email: '', roleId: '' });
        setIsCreateUserOpen(false);
        await fetchUsers();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create user');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const handleRoleChange = async (userId: string, newRoleId: string | null) => {
    try {
      setUpdatingRoles(prev => new Set(prev).add(userId));
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roleId: newRoleId || null }),
      });
      
      if (response.ok) {
        await fetchUsers();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update user role');
      }
    } catch (err) {
      console.error('Error updating user role:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user role');
    } finally {
      setUpdatingRoles(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            👥 Users Management
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Manage users in the system
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
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <a href="/users-management">👥 Users Management</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="/free-days">📅 Free Days</a>
            </Button>
          </nav>
        </header>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>UsersList</CardTitle>
                <CardDescription>
                  {users.length} user{users.length !== 1 ? 's' : ''} registered
                  {roles.length > 0 && ` • ${roles.length} role${roles.length !== 1 ? 's' : ''} available`}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {roles.length === 0 && (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      await initializeRoles();
                      await fetchRoles();
                    }}
                  >
                    Initialize Roles
                  </Button>
                )}
                <Button onClick={() => setIsCreateUserOpen(true)}>
                  + Create User
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading users...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchUsers}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No users found.</p>
                <p className="text-sm text-gray-400 mt-2">
                  Click "Create User" to add your first user.
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Updated At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {roles.length === 0 ? (
                            <span className="text-gray-400 text-sm">Loading roles...</span>
                          ) : (
                            <select
                              value={user.roleId || ''}
                              onChange={(e) => handleRoleChange(user.id, e.target.value || null)}
                              disabled={updatingRoles.has(user.id)}
                              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-w-[150px]"
                            >
                              <option value="">No Role</option>
                              {roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                  {role.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(user.updatedAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create User Dialog */}
        <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateUser} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  type="text"
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Enter user name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  type="email"
                  id="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Enter user email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={newUser.roleId}
                  onChange={(e) => setNewUser({ ...newUser, roleId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">No Role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateUserOpen(false);
                    setNewUser({ name: '', email: '', roleId: '' });
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Create User</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

