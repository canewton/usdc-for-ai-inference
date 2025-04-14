// app/(ai)/layout.tsx
"use client";
// Removed all client-side auth logic

import AiTabs from "@/components/AiTabs"; // Corrected path
import { RefreshProvider } from '../contexts/RefreshContext'; // Assuming RefreshContext is needed

export default function AILayout({ children }: { children: React.ReactNode }) {
  // No more session fetching here. Middleware handles protection.
  // SessionProvider might still be useful if you specifically need to pass
  // the access token or other *derived* session data down via context,
  // but the primary auth check is done.
  // For now, let's remove SessionProvider unless explicitly needed later.

  // Assuming RefreshProvider is still needed for AI components
  return (
    <RefreshProvider>
      <div className="ai-layout flex flex-col h-full pt-5"> {/* Ensure pt-5 doesn't cause overlap */}
        <div className="flex flex-row h-full w-full">
          {/* Left side bar with tabs and history */}
          <aside className="w-[300px] h-full flex flex-col flex-shrink-0"> {/* Added flex-shrink-0 */}
            <AiTabs />
            {/* History section portal target */}
            <div id="ai-history" className="flex-grow overflow-y-auto overflow-x-hidden" /> {/* Allow growth and scrolling */}
          </aside>

          {/* Middle and right sections */}
          <div className="flex flex-row flex-grow h-full overflow-hidden bg-white justify-between space-x-2"> {/* Use flex-grow and overflow-hidden */}
            {children}
          </div>
        </div>
      </div>
    </RefreshProvider>
  );
}