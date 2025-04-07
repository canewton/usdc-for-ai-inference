'use client';
import { useEffect, useState } from 'react';

import AiTabs from '@/components/AiTabs';
import Navbar from '@/components/Navbar';
import { createClient } from '@/utils/supabase/client';

import { Spinner } from '../../components/Spinner';
import { SessionProvider } from '../contexts/SessionContext';

export default function AILayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const supabase = await createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setSession(session.access_token);
      } else {
        setSession('');
      }
      setLoading(false);
    };
    getSession();
  }, []);

  if (loading) {
    return <Spinner />;
  }

  return (
    <SessionProvider access_token={session}>
      <Navbar />

      <div className="ai-layout flex flex-col pt-3">
        <div className="flex flex-row h-screen w-full">
          {/* Left side bar with tabs and history */}
          <aside className="w-1/4 h-screen flex flex-col pr-2">
            <AiTabs />
            {/* History section to be changed by tool */}
            <div id="ai-history" className="overflow-hidden" />
          </aside>

          {/* Middle and right sections  */}
          <div className="flex flex-row w-full h-full overflow-auto justify-between space-x-2 ">
            {children}
          </div>
        </div>
      </div>
    </SessionProvider>
  );
}
