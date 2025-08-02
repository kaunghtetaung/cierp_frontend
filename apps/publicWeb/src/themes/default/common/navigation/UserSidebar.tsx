'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { X, User, Settings, LogOut, Bell, Heart } from 'lucide-react';
import { Button } from '@/styled-components/ui/Button';

interface UserSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isAuthenticated?: boolean;
  className?: string;
}

/**
 * User Sidebar Component - Right sidebar for user menu
 */
export function UserSidebar({
  isOpen,
  onOpenChange,
  isAuthenticated = false
}: UserSidebarProps) {
  if (!isOpen || typeof window === 'undefined') {
    return null;
  }

  const sidebarContent = (
    <div className="fixed inset-0 z-[9999] md:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-neutral/50" 
        onClick={() => onOpenChange(false)}
      />
      
      {/* Sidebar - Right side */}
      <div className="fixed right-0 top-0 h-full w-80 bg-background border-l border-border shadow-lg transform transition-transform duration-200 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Account</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* User Menu Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {isAuthenticated ? (
              <nav className="space-y-2">
                {/* User Profile Section */}
                <div className="px-3 py-4 border-b border-border mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">John Doe</p>
                      <p className="text-sm text-muted-foreground">john@example.com</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <Link
                  href="/profile"
                  className="flex items-center space-x-3 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                  onClick={() => onOpenChange(false)}
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>

                <Link
                  href="/settings"
                  className="flex items-center space-x-3 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                  onClick={() => onOpenChange(false)}
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>

                <Link
                  href="/notifications"
                  className="flex items-center space-x-3 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                  onClick={() => onOpenChange(false)}
                >
                  <Bell className="h-4 w-4" />
                  <span>Notifications</span>
                </Link>

                <Link
                  href="/favorites"
                  className="flex items-center space-x-3 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                  onClick={() => onOpenChange(false)}
                >
                  <Heart className="h-4 w-4" />
                  <span>Favorites</span>
                </Link>

                <div className="border-t border-border my-4" />

                <button
                  className="flex items-center space-x-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors w-full text-left"
                  onClick={() => {
                    // Handle logout logic here
                    console.log('Logout clicked');
                    onOpenChange(false);
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </nav>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground px-3">Please sign in to access your account.</p>
                <Button 
                  className="w-full"
                  onClick={() => {
                    // Handle sign in logic here
                    console.log('Sign in clicked');
                    onOpenChange(false);
                  }}
                >
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(sidebarContent, document.body);
}

export default UserSidebar;