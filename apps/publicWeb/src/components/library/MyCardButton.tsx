'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@repo/ui';
import { IconComponent } from '@repo/ui';

/**
 * Floating action button menu to access library services
 * Shows only when user is authenticated
 * Includes: My Card, My Reservations
 */
export function MyCardButton() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.library-fab-menu')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  // Don't render anything while loading or if not authenticated
  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 library-fab-menu">
      {/* Expanded menu items */}
      <div className={`flex flex-col gap-3 mb-3 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <Link href="/library/my-reservations" onClick={() => setIsOpen(false)}>
          <Button
            size="default"
            variant="secondary"
            className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-5 py-5 bg-card hover:bg-accent group w-full justify-start"
          >
            <IconComponent name="CalendarClock" className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform text-primary" />
            <span className="font-medium">My Reservations</span>
          </Button>
        </Link>
        <Link href="/library/my-card" onClick={() => setIsOpen(false)}>
          <Button
            size="default"
            variant="secondary"
            className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-5 py-5 bg-card hover:bg-accent group w-full justify-start"
          >
            <IconComponent name="CreditCard" className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform text-primary" />
            <span className="font-medium">My Card</span>
          </Button>
        </Link>
      </div>

      {/* Main FAB button */}
      <Button
        size="lg"
        onClick={() => setIsOpen(!isOpen)}
        className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-6 py-6 bg-primary hover:bg-primary/90 group"
      >
        <IconComponent
          name={isOpen ? 'X' : 'User'}
          className={`w-5 h-5 mr-2 transition-transform ${isOpen ? 'rotate-0' : 'group-hover:scale-110'}`}
        />
        <span className="font-semibold">{isOpen ? 'Close' : 'My Library'}</span>
      </Button>
    </div>
  );
}
