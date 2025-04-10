'use client';
import { useEffect, useState } from 'react';

import AiTabs from '@/components/AiTabs';
import { createClient } from '@/utils/supabase/client';

import { Spinner } from '../../components/Spinner';
import { SessionProvider } from '../contexts/SessionContext';

export default function AILayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState('');
  const [loading, setLoading] = useState(true);
  const [apiKeyStatus, setApiKeyStatus] = useState({});

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

  const fetchAPIStatus = async () => {
    try {
      const response = await fetch("/api/check-api-keys")

      if (!response.ok) {
        throw new Error("Failed to fetch API status")
      }

      const data = await response.json()
      setApiKeyStatus(data.apiKeyStatus)
    } catch (err) {
      console.error("Error fetching API status:", err)
    } 
  }

  useEffect(() => {
    fetchAPIStatus();
    setLoading(false);
  }, []);

  

  if (loading) {
    return <Spinner />;
  }

  return (
    <SessionProvider access_token={session} api_key_status={apiKeyStatus}>
      <div className="ai-layout flex flex-col h-full pt-5">
        <div className="flex flex-row h-full w-full">
          {/* Left side bar with tabs and history */}
          <aside className="w-[300px] h-full flex flex-col">
            <AiTabs />
            {/* History section to be changed by tool */}
            <div id="ai-history" className="overflow-hidden" />
          </aside>

          {/* Middle and right sections  */}
          <div className="flex flex-row w-full h-full overflow-auto bg-white justify-between space-x-2 ">
            {children}
          </div>
        </div>
      </div>
    </SessionProvider>
  );
}
