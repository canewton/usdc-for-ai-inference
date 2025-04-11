'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

interface Props {
  tabs: string[];
  routes: string[];
  email: string;
  dropdowns?: {
    [tabKey: string]: React.JSX.Element;
  };
  dropdownRoutes?: {
    [tabKey: string]: string[];
  };
}

export default function Navbar({
  tabs,
  routes,
  email,
  dropdowns,
  dropdownRoutes,
}: Props) {
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navbarRef = useRef<HTMLDivElement>(null);

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

  const currentRoute = pathname.substring(
    pathname.indexOf('/') + 1,
    pathname.length,
  );

  const currentTabIndex = routes.indexOf(currentRoute);
  const selectedTab = currentTabIndex >= 0 ? tabs[currentTabIndex] : '';

  function tabContainsDropdownRoute(tab: string): boolean {
    if (!dropdownRoutes || !dropdownRoutes[tab]) return false;

    return dropdownRoutes[tab].some(
      (route) => currentRoute.startsWith(route) || currentRoute === route,
    );
  }

  return (
    <div className="mb-16">
      <div className="fixed top-0 left-0 right-0 min-h-16 bg-white border-b border-gray-200 flex items-center justify-between shadow-lg px-20 z-50">
        <div className="flex items-center">
          <img
            src={`${
              process.env.VERCEL_URL
                ? `${process.env.VERCEL_URL}`
                : 'localhost:3000'
            }/circle-logo-1.png`}
            alt="Circle Logo"
            className="h-8"
          />
          <div className="ml-10 space-x-4 flex items-center" ref={navbarRef}>
            {tabs.map((tab, index) => (
              <div key={tab} className="relative">
                <Link
                  className={`text-sm font-medium ${
                    selectedTab === tab || tabContainsDropdownRoute(tab)
                      ? 'text-blue-500'
                      : ''
                  }`}
                  href={`/${routes[index]}`}
                  onMouseEnter={() => {
                    if (dropdowns?.[tab]) {
                      setShowDropdown(tab);
                    }
                  }}
                >
                  {tab}
                </Link>
                {showDropdown === tab && dropdowns?.[tab] && (
                  <div
                    ref={dropdownRef}
                    className="absolute left-0 mt-6 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-72"
                    onMouseLeave={() => setShowDropdown('')}
                  >
                    {dropdowns[tab]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center">
          <div className="bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
            <span>{email.substring(0, 1).toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
