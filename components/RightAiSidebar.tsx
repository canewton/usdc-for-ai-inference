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
        isImageInput ? 'w-[300px] min-w-[300px]' : 'w-[200px] min-w-[200px]'
      } flex-shrink-0 flex-col items-center p-6 border border-gray-200 rounded-l-3xl bg-section space-y-[20px] h-[calc(100vh-85px)]`}
    >
      <div className="space-y-[20px] mt-4 w-full">{children}</div>
    </aside>
  );
}
