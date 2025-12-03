'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@repo/ui';
import { IconComponent } from '@repo/ui';

// Helper to extract role name from role object or string
function getRoleName(role: any): string {
  if (typeof role === 'string') return role.toLowerCase();
  if (role && typeof role === 'object' && role.Role) return role.Role.toLowerCase();
  return '';
}

// Check if user has any of the allowed roles (staff or student)
function hasAllowedRole(user: any): boolean {
  if (!user?.roles || !Array.isArray(user.roles)) return false;
  const allowedRoles = ['staff', 'student'];
  return user.roles.some((role: any) => allowedRoles.includes(getRoleName(role)));
}

/**
 * Floating action button menu to access library services
 * Shows only when user is authenticated AND has staff or student role
 * Includes: My Card, My Reservations
 */
export function MyCardButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user is authenticated and has allowed role (staff or student)
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        const isAuthenticated = !!data.user;
        const hasRole = hasAllowedRole(data.user);
        setIsVisible(isAuthenticated && hasRole);
        setIsLoading(false);
      })
      .catch(() => {
        setIsVisible(false);
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

  // Don't render anything while loading or if user doesn't have allowed role
  if (isLoading || !isVisible) {
    return null;
  }

  return (
    <div className="hidden md:block fixed bottom-6 right-6 z-50 library-fab-menu">
      {/* Expanded menu items */}
      <div className={`flex flex-col gap-3 mb-3 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <Link href="/library/my-reservations" onClick={() => setIsOpen(false)}>
          <Button
            size="default"
            variant="secondary"
            className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-5 py-5 bg-[#FF6855] hover:bg-[#FF6855]/90 text-white group w-full justify-start"
          >
            <IconComponent name="CalendarClock" className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform text-white" />
            <span className="font-medium">My Reservations</span>
          </Button>
        </Link>
        <Link href="/library/my-card" onClick={() => setIsOpen(false)}>
          <Button
            size="default"
            variant="secondary"
            className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-5 py-5 bg-[#FF6855] hover:bg-[#FF6855]/90 text-white group w-full justify-start"
          >
            <IconComponent name="CreditCard" className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform text-white" />
            <span className="font-medium">My Card</span>
          </Button>
        </Link>
      </div>

      {/* Main FAB button */}
      <Button
        size="lg"
        onClick={() => setIsOpen(!isOpen)}
        className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-6 py-6 bg-[#FF6855] hover:bg-[#FF6855]/90 text-white group"
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
