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
      className={`flex ${
        isImageInput ? 'w-[300px] min-w-70' : 'w-[200px] min-w-60'
      } flex-shrink-0 flex-col items-center p-6 border border-gray-200 rounded-l-3xl h-full bg-section space-y-[20px]`}
    >
      {children}
    </aside>
  );
}
