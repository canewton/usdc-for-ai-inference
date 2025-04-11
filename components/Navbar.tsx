'use client';

import { usePathname, useRouter } from 'next/navigation';
import React from 'react';

interface Props {
  tabs: string[];
  routes: string[];
  email: string;
}

export default function Navbar({ tabs, routes, email }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  // Get the current route's base path (first segment)
  const currentRoute = pathname.substring(
    pathname.indexOf('/') + 1,
    pathname.length,
  );

  // Find the index of the current route in the routes array
  const currentTabIndex = routes.indexOf(currentRoute);

  // Determine the selected tab (fallback to first tab if not found)
  const selectedTab = currentTabIndex >= 0 ? tabs[currentTabIndex] : tabs[0];

  return (
    <div className="mb-16">
      <div className="fixed top-0 left-0 right-0 min-h-16 bg-white border-b border-gray-200 flex items-center justify-between shadow-lg px-20 z-50">
        <div className="flex items-center">
          <img
            src={`${
              process.env.VERCEL_URL
                ? `${process.env.VERCEL_URL}`
                : 'localhost:3000'
            }/icons/circle-logo-1.png`}
            alt="Circle Logo"
            className="h-8"
          />
          <div className="ml-10 space-x-4">
            {tabs.map((tab, index) => (
              <button
                key={tab}
                className={`text-sm font-medium ${
                  selectedTab === tab ? 'text-blue-500' : ''
                }`}
                onClick={() => {
                  router.push(`/${routes[index]}`);
                }}
              >
                {tab}
              </button>
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
