import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { checkDemoLimit } from '@/app/utils/demoLimit';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Unauthorized', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Checking demo limit for user:', user.id);
    const { canGenerate, remaining } = await checkDemoLimit(user.id);
    console.log('Demo limit check result:', { canGenerate, remaining });

    return NextResponse.json({ canGenerate, remaining });
  } catch (error) {
    console.error('Error checking demo limit:', error);
    return NextResponse.json(
      { error: 'Failed to check demo limit' },
      { status: 500 },
    );
  }
}
