'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import ProductProvidersPage from './product-providers/page';
import XDConnectsPage from './xd-connects/page';
import MidoceanPage from './midocean/page';
import UsersManagementPage from './users-management/page';

type MenuItem = 'products' | 'xd-connects' | 'midocean' | 'users' | null;

export default function Home() {
  const [activeView, setActiveView] = useState<MenuItem>(null);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const toggleSubmenu = (menu: string) => {
    setExpandedMenu(expandedMenu === menu ? null : menu);
  };

  const handleMenuClick = (view: MenuItem) => {
    setActiveView(view);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* Left Menu Zone */}
      <div className="w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            🚀 BMAC Demo
          </h1>
          <p className="text-sm text-gray-600">
            Product Management System
          </p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Products Menu Item */}
          <Button
            variant={activeView === 'products' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => handleMenuClick('products')}
          >
            <span className="mr-2">📦</span>
            Products
          </Button>

          {/* Providers Menu with Submenu */}
          <div>
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => toggleSubmenu('providers')}
            >
              <span className="flex items-center">
                <span className="mr-2">🏢</span>
                Providers
              </span>
              <span className={`transition-transform duration-200 ${expandedMenu === 'providers' ? 'rotate-90' : ''}`}>
                ▶
              </span>
            </Button>
            {expandedMenu === 'providers' && (
              <div className="ml-6 mt-1 space-y-1">
                <Button
                  variant={activeView === 'xd-connects' ? 'default' : 'ghost'}
                  className="w-full justify-start text-sm"
                  onClick={() => handleMenuClick('xd-connects')}
                >
                  <span className="mr-2">🔗</span>
                  XD Connects
                </Button>
                <Button
                  variant={activeView === 'midocean' ? 'default' : 'ghost'}
                  className="w-full justify-start text-sm"
                  onClick={() => handleMenuClick('midocean')}
                >
                  <span className="mr-2">🌊</span>
                  Midocean
                </Button>
              </div>
            )}
          </div>

          {/* Users Menu Item */}
          <Button
            variant={activeView === 'users' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => handleMenuClick('users')}
          >
            <span className="mr-2">👥</span>
            Users
          </Button>
        </nav>
      </div>

      {/* Right Working Zone */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-100">
        {activeView === null ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to BMAC Demo
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Select a menu item from the left to get started
              </p>
            </div>
          </div>
        ) : activeView === 'products' ? (
          <ProductProvidersPage embedded={true} />
        ) : activeView === 'xd-connects' ? (
          <XDConnectsPage embedded={true} />
        ) : activeView === 'midocean' ? (
          <MidoceanPage embedded={true} />
        ) : activeView === 'users' ? (
          <UsersManagementPage embedded={true} />
        ) : null}
      </div>
    </div>
  );
}
