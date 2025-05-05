'use client';

import { useEffect, useState } from 'react';

import { createClient } from '@/utils/supabase/client';

import { useSession } from '../contexts/SessionContext';

export function useDemoLimit() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const session = useSession();
  const supabase = createClient();

  async function checkLimit() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const response = await fetch('/api/check-demo-limit');
        const data = await response.json();

        if (response.ok) {
          setRemaining(data.remaining);
        } else {
          setError('Failed to check demo limit.');
        }
        setError(null);
      }
    } catch (error) {
      console.error('Error checking demo limit:', error);
      setError('Error checking demo limit.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkLimit();
  }, []);

  useEffect(() => {
    session.setDemoLimit(remaining ?? 0);
  }, [remaining]);

  return { remaining, loading, refetch: checkLimit, error };
}
