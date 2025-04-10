'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

interface Props {
  tabs: string[];
  routes: string[];
  email: string;
}

export default function Navbar({ tabs, routes, email }: Props) {
  const [selectedTab, setSelectedTab] = useState(tabs[0]);
  const router = useRouter();

  return (
    <div className="mb-16">
      <div className="fixed top-0 left-0 right-0 min-h-16 bg-white border-b border-gray-200 flex items-center justify-between shadow-lg px-20 z-50">
        <div className="flex items-center">
          <img
            src="icons/circle-logo-1.png"
            alt="Circle Logo"
            className="h-8"
          />
          <div className="ml-10 space-x-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`text-sm font-medium ${
                  selectedTab === tab ? 'text-blue-500' : ''
                }`}
                onClick={() => {
                  setSelectedTab(tab);
                  router.push(`/${routes[tabs.indexOf(tab)]}`);
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center">
          <div className="bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
            <span>{email.substring(0, 1).toLocaleUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
