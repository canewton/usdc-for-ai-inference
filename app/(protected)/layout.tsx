'use server';

import { Geist } from 'next/font/google';

import Navbar from '@/components/common/navbar';
import type { Profile, Wallet } from '@/types/database.types';
import { createClient } from '@/utils/supabase/server';

import { SessionProvider } from '../contexts/SessionContext';

const geistSans = Geist({
  display: 'swap',
  subsets: ['latin'],
});

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch profile data only if user exists
  let profile: Profile | null = null;
  let wallet: Wallet | null = null;
  if (user) {
    await supabase
      .from('profiles')
      .update({ last_active: new Date().toISOString() })
      .eq('auth_user_id', user.id);

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();
    profile = profileData;
  }

  if (profile) {
    // Get wallet
    const { data: walletData } = await supabase
      .schema('public')
      .from('wallets')
      .select()
      .eq('profile_id', profile.id)
      .single();
    wallet = walletData;
  }

  return (
    <SessionProvider
      walletId={wallet?.id ?? null}
      circleWalletId={wallet?.circle_wallet_id ?? null}
      apiKeyStatus={{
        text: process.env.OPENAI_API_KEY ? true : false,
        image: process.env.REPLICATE_API_TOKEN ? true : false,
        model: process.env.MESHY_API_KEY ? true : false,
        video: process.env.NOVITA_API_KEY ? true : false,
      }}
    >
      <Navbar user={user} profile={profile} />
      <div className="flex flex-col flex-1">{children}</div>
    </SessionProvider>
  );
}
