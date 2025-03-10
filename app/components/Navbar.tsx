import React from 'react';

export default function Navbar() {
  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      <div className="flex items-center">
        <div className="font-medium">CIRCLE</div>
        <div className="ml-6 space-x-4">
          <button className="text-sm font-medium">Manage Wallet</button>
          <button className="text-sm font-medium text-blue-500">Build with AI</button>
        </div>
      </div>
      <div className="flex items-center">
        <div className="bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
          <span>CL</span>
        </div>
      </div>
    </div>
  );
}