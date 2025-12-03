'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

// Helper to extract role name from role object or string
function getRoleName(role: any): string {
  if (typeof role === 'string') return role.toLowerCase();
  if (role && typeof role === 'object' && role.Role) return role.Role.toLowerCase();
  return '';
}

// Check if user has any of the allowed roles (staff or student)
function hasLibraryRole(user: any): boolean {
  if (!user?.roles || !Array.isArray(user.roles)) return false;
  const allowedRoles = ['staff', 'student'];
  return user.roles.some((role: any) => allowedRoles.includes(getRoleName(role)));
}

interface UserState {
  isAuthenticated: boolean;
  hasLibraryAccess: boolean;
}

/**
 * Mobile footer navigation for library pages
 * Shows: Home | Search | (Profile OR MyCard + Reservations based on role)
 */
export function LibraryMobileFooter() {
  const pathname = usePathname();
  const router = useRouter();
  const [userState, setUserState] = useState<UserState>({
    isAuthenticated: false,
    hasLibraryAccess: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated and has allowed role (staff or student)
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        const isAuthenticated = !!data.user;
        const hasAccess = hasLibraryRole(data.user);
        setUserState({
          isAuthenticated,
          hasLibraryAccess: hasAccess,
        });
        setIsLoading(false);
      })
      .catch(() => {
        setUserState({ isAuthenticated: false, hasLibraryAccess: false });
        setIsLoading(false);
      });
  }, []);

  // Focus on search input when clicking search button
  const handleSearchClick = () => {
    // Check if we're on a page that doesn't have a search box (my-card, my-reservations)
    const needsRedirect = pathname.includes('/my-card') || pathname.includes('/my-reservations');

    if (needsRedirect) {
      // Navigate to library page with a flag to focus search
      router.push('/library?focusSearch=true');
    } else {
      // Try to find and focus the search input on current page
      const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]') as HTMLInputElement
        || document.querySelector('input[type="text"][placeholder*="books"]') as HTMLInputElement
        || document.querySelector('input[placeholder*="စာအုပ်"]') as HTMLInputElement;

      if (searchInput) {
        searchInput.focus();
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // Fallback: scroll to top where search box is
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Check if current path matches
  const isActive = (path: string) => pathname === path;

  // Common button styles
  const buttonBase = "flex flex-col items-center justify-center flex-1 py-2 transition-colors";
  const activeColor = "text-[#FF6855]";
  const inactiveColor = "text-gray-600";

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {/* Home */}
        <Link
          href="/"
          className={`${buttonBase} ${isActive('/') ? activeColor : inactiveColor}`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs mt-1 font-medium">Home</span>
        </Link>

        {/* Search */}
        <button
          onClick={handleSearchClick}
          className={`${buttonBase} ${inactiveColor}`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-xs mt-1 font-medium">Search</span>
        </button>

        {/* Role-based icons */}
        {isLoading ? (
          // Loading placeholder
          <div className={`${buttonBase} ${inactiveColor}`}>
            <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
            <div className="w-8 h-2 mt-1 rounded bg-gray-200 animate-pulse" />
          </div>
        ) : userState.hasLibraryAccess ? (
          // Staff/Student: Show My Card (QR Code) and My Reservations
          <>
            {/* My Card - QR Code icon */}
            <Link
              href="/library/my-card"
              className={`${buttonBase} ${isActive('/library/my-card') ? activeColor : inactiveColor}`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {/* QR Code icon */}
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h6v6H3V3zM15 3h6v6h-6V3zM3 15h6v6H3v-6zM15 15h3v3h-3v-3zM18 18h3v3h-3v-3zM15 21h3v-3M21 15v3M12 3v3M12 9v3M12 15v6M9 12h3" />
              </svg>
              <span className="text-xs mt-1 font-medium">My Card</span>
            </Link>

            {/* My Reservations - Calendar icon */}
            <Link
              href="/library/my-reservations"
              className={`${buttonBase} ${isActive('/library/my-reservations') ? activeColor : inactiveColor}`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs mt-1 font-medium">Reservations</span>
            </Link>
          </>
        ) : userState.isAuthenticated ? (
          // Authenticated but not staff/student: Show Profile
          <Link
            href="/profile"
            className={`${buttonBase} ${pathname.startsWith('/profile') ? activeColor : inactiveColor}`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-1 font-medium">Profile</span>
          </Link>
        ) : (
          // Not authenticated: Show Login
          <Link
            href="/login"
            className={`${buttonBase} ${inactiveColor}`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            <span className="text-xs mt-1 font-medium">Login</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
