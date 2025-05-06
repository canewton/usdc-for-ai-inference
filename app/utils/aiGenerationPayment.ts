import type { User } from 'next-auth';

import { createClient } from '@/utils/supabase/server';

import { circleWalletTransfer } from '../(ai)/server/circleWalletTransfer';

export async function aiGenerationPayment(
  user: User,
  title: string,
  type: string,
  price: number,
) {
  const supabase = await createClient();

  let profile: any = null;
  let wallet: any = null;
  if (user) {
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
      .from('wallets')
      .select()
      .eq('profile_id', profile.id)
      .single();
    wallet = walletData;
  }

  const transfer = await circleWalletTransfer(
    title,
    type,
    wallet.circle_wallet_id,
    `${price}`,
  );

  return transfer;
}
