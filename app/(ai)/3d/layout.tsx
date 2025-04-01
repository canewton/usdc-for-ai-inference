'use client';
import { useEffect, useState } from 'react';

import { createClient } from '@/utils/supabase/client';

import { Spinner } from '../../components/Spinner';
import { SessionProvider } from '../../contexts/SessionContext';

export default function ModelLayout({
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
      setSession(session ? session.access_token : '');
      setLoading(false);
    };
    getSession();
  }, []);

  if (loading) {
    return <Spinner />;
  }

  return (
    <SessionProvider access_token={session}>
      <div className="model-layout">{children}</div>
    </SessionProvider>
  );
}
