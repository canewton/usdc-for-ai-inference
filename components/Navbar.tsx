// components/Navbar.tsx
'use client';

import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

import { signOutAction } from '@/app/actions'; // Assuming actions are in app/actions
import { NavbarAIDropdown } from '@/components/navbar-ai-dropdown';
import { Button } from '@/components/ui/button';
import type { Profile } from '@/types/database.types'; // Assuming types/database.types.ts exists

interface NavbarProps {
  user: User | null;
  profile: Profile | null;
}

// Define Tab configurations
interface NavTab {
  name: string;
  route: string;
  dropdown?: React.ReactNode;
  dropdownRoutes?: string[];
}

const commonTabs: NavTab[] = [
  { name: 'Manage Wallet', route: '/dashboard' },
  { name: 'Build with AI', route: '/chat', dropdown: <NavbarAIDropdown />, dropdownRoutes: ['chat', '3d', 'image', 'image-generator', 'video'] },
];

const adminTabs: NavTab[] = [
  { name: 'Website Analytics', route: '/admin' },
  { name: 'Treasury Wallet', route: '/admin/treasury-wallet' },
];

export default function Navbar({ user, profile }: NavbarProps) {
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navbarRef = useRef<HTMLDivElement>(null);

  // Determine which tabs to display
  const tabsToDisplay = profile?.is_admin ? adminTabs : commonTabs;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        navbarRef.current &&
        !navbarRef.current.contains(event.target as Node)
      ) {
        setShowDropdown('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to determine if a tab is active
  const isTabActive = (tabRoute: string, tabDropdownRoutes?: string[]) => {
    // Exact match or base path match
     if (pathname === tabRoute || pathname.startsWith(tabRoute + '/')) {
        return true;
     }
     // Check dropdown routes if provided
     if (tabDropdownRoutes) {
        return tabDropdownRoutes.some(dropdownRoute => pathname.startsWith(`/${dropdownRoute}`));
     }
     return false;
  };


  return (
    <div className="mb-16"> {/* Added margin-bottom to prevent content overlap */}
      <div className="fixed top-0 left-0 right-0 min-h-16 bg-white border-b border-gray-200 flex items-center justify-between shadow-lg px-6 md:px-20 z-50">
        {/* Logo */}
        <Link href={user ? (profile?.is_admin ? '/admin' : '/dashboard') : '/sign-in'} className="flex items-center">
           <img
            src="/circle-logo-1.png" // Assumes logo is in public folder
            alt="Circle Logo"
            className="h-8 w-auto" // Use w-auto for proper scaling
          />
        </Link>

        {/* Navigation Tabs (Only if user is logged in) */}
        {user && (
          <div className="flex-grow flex justify-center items-center" ref={navbarRef}>
            <div className="flex items-center space-x-4 md:space-x-8">
              {tabsToDisplay.map((tab) => (
                <div key={tab.name} className="relative">
                   <Link
                    href={tab.route}
                    className={`text-sm font-medium transition-colors ${
                      isTabActive(tab.route, tab.dropdownRoutes)
                        ? 'text-blue-500'
                        : 'text-gray-600 hover:text-blue-500'
                    }`}
                    onMouseEnter={() => {
                      if (tab.dropdown) {
                        setShowDropdown(tab.name);
                      }
                    }}
                    onClick={() => setShowDropdown('')} // Close dropdown on click
                  >
                    {tab.name}
                  </Link>
                  {showDropdown === tab.name && tab.dropdown && (
                    <div
                      ref={dropdownRef}
                      className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-[60]" // Increased z-index
                      onMouseLeave={() => setShowDropdown('')}
                    >
                      {tab.dropdown}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auth Section */}
        <div className="flex items-center space-x-3">
          {user ? (
            <>
              <div className="text-sm text-gray-600 hidden md:block">
                {user.email}
              </div>
               {/* Simple Profile Initial Circle */}
               <div className="bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium">
                {user.email ? user.email[0].toUpperCase() : '?'}
               </div>
              <form action={signOutAction}>
                <Button type="submit" variant="outline" size="sm">
                  Sign Out
                </Button>
              </form>
            </>
          ) : (
             // Show Sign In/Sign Up buttons if not logged in and not on auth pages
             !pathname.startsWith('/sign-in') && !pathname.startsWith('/sign-up') && (
                <>
                    <Button asChild size="sm" variant="ghost">
                    <Link href="/sign-in">Sign In</Link>
                    </Button>
                    <Button asChild size="sm" variant="default">
                    <Link href="/sign-up">Sign Up</Link>
                    </Button>
                </>
            )
          )}
        </div>
      </div>
    </div>
  );
}