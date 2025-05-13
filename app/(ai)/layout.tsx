// app/(ai)/layout.tsx

import AiTabs from '@/components/ai/common/ai-table'; // Corrected path

export default function AILayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full pt-2">
      {' '}
      {/* Ensure pt-5 doesn't cause overlap */}
      <div className="flex flex-row h-full w-full">
        {/* Left side bar with tabs and history */}
        <aside className="w-[300px] h-full flex flex-col flex-shrink-0">
          {' '}
          {/* Added flex-shrink-0 */}
          <AiTabs />
          {/* History section portal target */}
          <div
            id="ai-history"
            className="flex-grow overflow-y-auto overflow-x-hidden"
          />{' '}
          {/* Allow growth and scrolling */}
        </aside>

        {/* Middle and right sections */}
        <div className="flex flex-row flex-grow h-full overflow-hidden bg-white justify-between space-x-2">
          {' '}
          {/* Use flex-grow and overflow-hidden */}
          {children}
        </div>
      </div>
    </div>
  );
}
