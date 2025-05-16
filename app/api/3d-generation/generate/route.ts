import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { createDatabaseBucketItem } from '@/app/utils/createDatabaseBucketItem';
import { checkDemoLimit } from '@/app/utils/demoLimit';
import { MODEL_ASSET_PRICING } from '@/utils/constants';
import { circleDeveloperSdk } from '@/utils/developer-controlled-wallets-client';
import { createClient } from '@/utils/supabase/server';

const MESHY_API_KEY = process.env.MESHY_API!;
const MESHY_API_URL =
  process.env.MESHY_BASE_URL || 'https://api.meshy.ai/openapi/v1/image-to-3d';

const HEADERS = {
  Authorization: `Bearer ${MESHY_API_KEY}`,
  'Content-Type': 'application/json',
};

interface MeshyResponse {
  result: string;
}

// returns model url
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    /**
     * INPUT PARAMETERS:
     *
     * image_url         : string
     *    Public image URL or a base64 data URI. (Required)
     *
     * enable_pbr        : boolean (default: false)
     *    Indicates whether to generate Physically Based Rendering (PBR) maps in addition to the base color.
     *
     * should_remesh     : boolean (default: true)
     *    Determines whether to disregard existing topology and target polycount during remeshing.
     *
     * should_texture    : boolean (default: true)
     *    Specifies whether to add texturing to the 3D model.
     *    - false: incurs a cost of 5 tokens.
     *    - true: incurs a cost of 15 tokens.
     *
     * texture_prompt    : string
     *    Descriptive prompt detailing the desired model texture. (Required)
     */
    const {
      image_url,
      should_texture,
      texture_prompt,
      circle_wallet_id,
      title,
    } = await req.json();

    const response = await circleDeveloperSdk.getWalletTokenBalance({
      id: circle_wallet_id,
      includeAll: true,
    });

    const parsedAmount = response.data?.tokenBalances?.find(
      ({ token }: { token: { symbol?: string } }) => token.symbol === 'USDC',
    )?.amount;

    if (
      !parsedAmount ||
      parseInt(parsedAmount) - MODEL_ASSET_PRICING.userBilledPrice < 0
    ) {
      console.log('Insufficient wallet balance');
      return NextResponse.json(
        { error: 'Insufficient wallet balance' },
        { status: 400 },
      );
    }

    const { canGenerate, remaining } = await checkDemoLimit(user.id);
    if (!canGenerate) {
      return NextResponse.json(
        { error: 'Demo limit reached.' },
        { status: 429 },
      );
    }

    const base64Data = image_url.split(';base64,').pop();
    const fileBuffer = Buffer.from(base64Data, 'base64');
    const imageData = await createDatabaseBucketItem(
      fileBuffer,
      '3d-prompts',
      `${user.id}_${uuidv4()}.webp`,
      'image/webp',
      '3600',
    );
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${imageData?.data?.fullPath}`;

    const generatePreviewResponse = await fetch(MESHY_API_URL, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        image_url,
        should_texture,
        texture_prompt,
      }),
    });

    if (!generatePreviewResponse.ok) {
      throw new Error('Failed to create preview model.');
    }

    const meshyResponse: MeshyResponse = await generatePreviewResponse.json();
    const taskId: string = meshyResponse.result;

    const { data, error: dbError } = await supabase
      .from('3d_generations')
      .insert([
        {
          image_url: publicUrl,
          prompt: texture_prompt,
          user_id: user.id,
          provider: 'Meshy',
          mode: 'Preview',
          title,
          task_id: taskId,
        },
      ])
      .select('*')
      .single();

    if (dbError) {
      console.error('Error saving 3d generation:', dbError);
      return NextResponse.json(
        { error: 'Error saving 3d generation' },
        { status: 500 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error generating 3D model:', error);
    return NextResponse.json(
      { error: 'Failed to generate 3D model' },
      { status: 500 },
    );
  }
}
