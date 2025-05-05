// components/Navbar.tsx
'use client';

import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { signOutAction } from '@/app/actions'; // Assuming actions are in app/actions
import { useSession } from '@/app/contexts/SessionContext';
import { useDemoLimit } from '@/app/hooks/useDemoLimit';
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
  {
    name: 'Build with AI',
    route: '/chat',
    dropdown: <NavbarAIDropdown />,
    dropdownRoutes: ['chat', '3d', 'image', 'video'],
  },
];

const adminTabs: NavTab[] = [
  { name: 'Website Analytics', route: '/admin' },
  { name: 'Treasury Wallet', route: '/admin/treasury-wallet' },
];

export default function Navbar({ user, profile }: NavbarProps) {
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [refetched, setRefetched] = useState(false);
  const [dropdownHovered, setDropdownHovered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navbarRef = useRef<HTMLDivElement>(null);
  const session = useSession();
  const router = useRouter();

  // update global demo limit state on load
  const { refetch, error } = useDemoLimit();

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

  useEffect(() => {
    if (user && !profile?.is_admin) {
      refetch();
      setRefetched(true);
    }
  }, [user, profile]);

  useEffect(() => {
    if (user && !profile?.is_admin && error && refetched) {
      toast.error(error);
    }
  }, [user, profile, error]);

  // Function to determine if a tab is active
  const isTabActive = (tabRoute: string, tabDropdownRoutes?: string[]) => {
    // Exact match or base path match
    if (pathname === tabRoute || pathname.startsWith(tabRoute + '/')) {
      return true;
    }
    // Check dropdown routes if provided
    if (tabDropdownRoutes) {
      return tabDropdownRoutes.some((dropdownRoute) =>
        pathname.startsWith(`/${dropdownRoute}`),
      );
    }
    return false;
  };

  return (
    <div
      className="pb-[70px]"
      onMouseLeave={() => {
        if (!dropdownHovered) {
          setShowDropdown('');
          setShowProfileDropdown(false);
        }
      }}
    >
      {' '}
      {/* Added margin-bottom to prevent content overlap */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between shadow-lg px-6 md:px-8 z-50">
        {/* Logo */}
        <div className="flex items-center space-x-[50px]">
          <Link
            href={
              user ? (profile?.is_admin ? '/admin' : '/dashboard') : '/sign-in'
            }
            className="flex items-center"
          >
            <img
              src="/circle-logo-1.png" // Assumes logo is in public folder
              alt="Circle Logo"
              className="h-8 w-auto" // Use w-auto for proper scaling
            />
          </Link>

          {/* Navigation Tabs (Only if user is logged in) */}
          {user && (
            <div
              className="flex-grow flex justify-center items-center"
              ref={navbarRef}
            >
              <div className="flex items-center space-x-4 md:space-x-8">
                {tabsToDisplay.map((tab) => (
                  <div key={tab.name} className="relative">
                    <button
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
                      onClick={() => {
                        setShowDropdown('');
                        if (!session.isAiInferenceLoading) {
                          router.push(tab.route);
                        } else {
                          toast.info(
                            'Please wait for the current generation to finish.',
                          );
                        }
                      }} // Close dropdown on click
                    >
                      {tab.name}
                    </button>
                    {showDropdown === tab.name && tab.dropdown && (
                      <div
                        ref={dropdownRef}
                        className="absolute left-1/2 transform -translate-x-1/2 mt-6 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-[60]" // Increased z-index
                        onMouseLeave={() => {
                          setShowDropdown('');
                          setDropdownHovered(false);
                        }}
                        onMouseEnter={() => {
                          setDropdownHovered(true);
                        }}
                      >
                        {tab.dropdown}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-[50px]">
          {user && (
            <p className="text-sm text-gray-400">
              Demo AI generations remaining: {session.demoLimit}
            </p>
          )}

          {/* Auth Section */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="relative">
                {/* Profile Circle (Dropdown Trigger) */}
                <div
                  className="bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer"
                  onMouseEnter={() => setShowProfileDropdown(true)}
                >
                  {user.email ? user.email[0].toUpperCase() : '?'}
                </div>

                {/* Dropdown Menu */}
                {showProfileDropdown && (
                  <div
                    className="absolute -right-4 mt-5 mx-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                    onMouseEnter={() => setShowProfileDropdown(true)}
                    onMouseLeave={() => setShowProfileDropdown(false)}
                  >
                    <div className="block w-full px-4 py-2 text-center">
                      <p className="text-sm text-gray-700">{user.email}</p>
                    </div>
                    <button
                      className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-center"
                      onClick={signOutAction}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Show Sign In/Sign Up buttons if not logged in and not on auth pages
              !pathname.startsWith('/sign-in') &&
              !pathname.startsWith('/sign-up') && (
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
    </div>
  );
}
