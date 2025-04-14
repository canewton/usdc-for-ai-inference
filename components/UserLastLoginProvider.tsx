'use client';

import React, { useEffect } from 'react';

import { createClient } from '@/utils/supabase/client';

const UserLastLoginProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    const updateLastActive = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('profiles')
          .update({ last_active: new Date().toISOString() })
          .eq('auth_user_id', user.id);
      }
    };

    updateLastActive();
  }, []);

  return <>{children}</>;
};

export default UserLastLoginProvider;
