import { createClient } from '@/utils/supabase/server';

import { circleWalletTransfer } from '../(ai)/server/circleWalletTransfer';

export async function aiGenerationPayment(
  user: any,
  title: string,
  type: string,
  price: number,
) {
  try {
    const supabase = await createClient();

    let profile: any = null;
    let wallet: any = null;
    if (user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();
      profile = profileData;

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw new Error('Failed to fetch user profile');
      }
    }

    if (profile) {
      // Get wallet
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select()
        .eq('profile_id', profile.id)
        .single();
      wallet = walletData;

      if (walletError) {
        console.error('Error fetching wallet:', walletError);
        throw new Error('Failed to fetch user wallet');
      }
    }

    const transfer = await circleWalletTransfer(
      title,
      type,
      wallet.circle_wallet_id,
      `${price}`,
    );

    return transfer;
  } catch (error) {
    console.error('Error in aiGenerationPayment:', error);
    throw new Error('Failed to process payment');
  }
}
