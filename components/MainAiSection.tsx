import React from 'react';

export default function MainAiSection({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-col w-full h-[calc(100vh-85px)] border border-gray-200 p-6 px-4 rounded-3xl bg-section">
      {children}
    </main>
  );
}
