'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Spinner } from '../components/Spinner';
import { SessionProvider } from '../contexts/SessionContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function ImageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      <div className="flex flex-col h-screen">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </SessionProvider>
  );
}