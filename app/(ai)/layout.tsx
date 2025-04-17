// app/(ai)/layout.tsx

import AiTabs from '@/components/AiTabs'; // Corrected path

import { RefreshProvider } from '../contexts/RefreshContext'; // Assuming RefreshContext is needed

export default function AILayout({ children }: { children: React.ReactNode }) {
  // Assuming RefreshProvider is still needed for AI components
  return (
    <RefreshProvider>
      <div className="ai-layout flex flex-col h-full pt-5">
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
    </RefreshProvider>
  );
}
