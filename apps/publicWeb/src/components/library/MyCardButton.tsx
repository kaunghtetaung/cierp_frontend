'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@repo/ui';
import { IconComponent } from '@repo/ui';

/**
 * Floating action button to access digital borrower card
 * Shows only when user is authenticated
 */
export function MyCardButton() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated by calling the session endpoint
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        setIsAuthenticated(!!data.user);
        setIsLoading(false);
      })
      .catch(() => {
        setIsAuthenticated(false);
        setIsLoading(false);
      });
  }, []);

  // Don't render anything while loading or if not authenticated
  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Link href="/library/my-card">
        <Button
          size="lg"
          className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-6 py-6 bg-primary hover:bg-primary/90 group"
        >
          <IconComponent name="CreditCard" className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
          <span className="font-semibold">My Card</span>
        </Button>
      </Link>
    </div>
  );
}
