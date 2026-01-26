'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Type guard to ensure data matches User interface
const isValidUser = (data: any): data is User => {
  return (
    data &&
    typeof data.id === 'string' &&
    typeof data.email === 'string' &&
    typeof data.name === 'string' &&
    typeof data.createdAt === 'string' &&
    typeof data.updatedAt === 'string'
  );
};

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ name: '', email: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      // Ensure data is an array and has the expected structure
      if (Array.isArray(data)) {
        const validUsers = data.filter(isValidUser);
        setUsers(validUsers);
      } else {
        console.error('Unexpected data format:', data);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });
      
      if (response.ok) {
        setNewUser({ name: '', email: '' });
        fetchUsers();
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚀 Next.js + Tailwind + Drizzle + SQLite
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            A modern full-stack setup ready for development
          </p>
          
          {/* Navigation */}
          <nav className="flex justify-center space-x-4 flex-wrap gap-2">
            <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
              <a href="/products">
                🛍️ Products Management
              </a>
            </Button>
            <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
              <a href="/requests">
                📋 Product Requests
              </a>
            </Button>
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <a href="/midocean">
                🌊 Midocean API
              </a>
            </Button>
            <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
              <a href="/xd-connects">
                🔗 XD Connects
              </a>
            </Button>
            <Button asChild size="lg" variant="default">
              <a href="/">
                👥 Users Management
              </a>
            </Button>
          </nav>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Create User Form */}
          <Card>
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
              <CardDescription>
                Add a new user to the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createUser} className="space-y-4">
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
                <Button type="submit" className="w-full">
                  Create User
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Users
                <Badge variant="secondary">{users.length}</Badge>
              </CardTitle>
              <CardDescription>
                List of all registered users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading users...</p>
                </div>
              ) : users.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No users found. Create your first user!
                </p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {users.map((user) => (
                    <Card key={user.id} className="p-3">
                      <div className="space-y-1">
                        <h3 className="font-medium text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-400">
                          Created: {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tech Stack Info */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🛠️ Tech Stack
            </CardTitle>
            <CardDescription>
              Modern technologies powering this application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="text-center p-4">
                <div className="text-2xl mb-2">⚡</div>
                <h3 className="font-semibold text-gray-800">Next.js 15</h3>
                <p className="text-sm text-gray-600">Latest version</p>
              </Card>
              <Card className="text-center p-4">
                <div className="text-2xl mb-2">🎨</div>
                <h3 className="font-semibold text-gray-800">Tailwind CSS</h3>
                <p className="text-sm text-gray-600">Utility-first CSS</p>
              </Card>
              <Card className="text-center p-4">
                <div className="text-2xl mb-2">🗄️</div>
                <h3 className="font-semibold text-gray-800">Drizzle ORM</h3>
                <p className="text-sm text-gray-600">Type-safe queries</p>
              </Card>
              <Card className="text-center p-4">
                <div className="text-2xl mb-2">🗄️</div>
                <h3 className="font-semibold text-gray-800">SQLite</h3>
                <p className="text-sm text-gray-600">Single container</p>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
