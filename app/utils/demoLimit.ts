import { createClient } from '@/utils/supabase/server';

export async function checkDemoLimit(
  userId: string,
): Promise<{ canGenerate: boolean; remaining: number }> {
  try {
    const supabase = await createClient();

    let profile: any = null;
    let wallet: any = null;
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', userId)
      .single();
    profile = profileData;

    if (profileError) {
      throw new Error('Failed to fetch user profile');
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
        throw new Error('Failed to fetch user wallet');
      }
    }

    if (!wallet) {
      return { canGenerate: true, remaining: 5 };
    }

    const { data: aiProjects, error: projectsError } = await supabase
      .from('ai_projects')
      .select('id')
      .eq('circle_wallet_id', wallet.circle_wallet_id);

    if (projectsError) {
      throw new Error('Failed to fetch AI projects');
    }

    const totalGenerations = aiProjects?.length;

    const remaining = Math.max(
      0,
      parseInt(process.env.USER_AI_GENERATION_LIMIT ?? '5') - totalGenerations,
    );
    return { canGenerate: true, remaining };
  } catch (error) {
    console.error('Error checking demo limit:', error);
    return { canGenerate: true, remaining: 5 };
  }
}
