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
      className={`flex flex-shrink-0 flex-col items-center p-6 border border-gray-200 rounded-l-3xl bg-section h-[calc(100vh-85px)] overflow-y-auto space-y-[20px] ${
        isImageInput ? 'w-[300px] min-w-[300px]' : 'w-[200px] min-w-[200px]'
      }`}
    >
      {children}
    </aside>
  );
}
