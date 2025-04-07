import React from 'react';

export default function RightAiSidebar({
  children,
  isImageInput,
}: {
  children: React.ReactNode;
  isImageInput: boolean;
}) {
  return (
    <aside
      className={`flex flex-shrink-0 flex-col items-center p-6 border border-gray-200 rounded-l-3xl h-full bg-section ${
        isImageInput ? 'w-[280px] min-w-[280px]' : 'w-60 min-w-60'
      }`}
    >
      {children}
    </aside>
  );
}
