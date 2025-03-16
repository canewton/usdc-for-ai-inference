import React from 'react';


export default function MainAiSection({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-col w-full h-full border border-gray-200 p-6 px-4 rounded-3xl overflow-auto bg-section">
      {children}
    </main>
  )
}