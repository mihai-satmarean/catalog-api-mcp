'use client';

import { useState, useEffect } from 'react';

export function CIContinueBanner() {
  const [isShuttingDown, setIsShuttingDown] = useState(false);
  const [isCIMode, setIsCIMode] = useState(false);

  useEffect(() => {
    // Check if running in CI test mode
    const checkCIMode = async () => {
      // Don't show banner on production domain
      const hostname = window.location.hostname;
      if (hostname === 'unjestingly-unfoaled-donita.ngrok-free.dev' || 
          hostname === 'localhost' ||
          hostname === '127.0.0.1') {
        return;
      }
      
      // Only show on temporary ngrok URLs (random subdomains)
      try {
        const response = await fetch('/api/ci-continue');
        if (response.ok) {
          setIsCIMode(true);
        }
      } catch (error) {
        // Endpoint doesn't exist, not in CI mode
      }
    };
    
    checkCIMode();
  }, []);

  if (!isCIMode) return null;

  const handleContinue = async () => {
    if (!confirm('Are you done testing? This will shut down the container and continue the CI build.')) {
      return;
    }

    setIsShuttingDown(true);
    
    try {
      await fetch('/api/ci-continue', { method: 'POST' });
      // Container will shut down, no response expected
    } catch (error) {
      console.log('Container shutting down...', error);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black p-4 text-center font-bold shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex-1">
          <span className="mr-4">CI TEST MODE - Review the application</span>
          {isShuttingDown && (
            <span className="text-red-700">(Shutting down...)</span>
          )}
        </div>
        <button
          onClick={handleContinue}
          disabled={isShuttingDown}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded transition-colors"
        >
          {isShuttingDown ? 'Shutting down...' : 'Continue CI Build'}
        </button>
      </div>
    </div>
  );
}
