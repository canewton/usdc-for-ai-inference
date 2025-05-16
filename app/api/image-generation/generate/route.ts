import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { v4 as uuidv4 } from 'uuid';

import { createDatabaseBucketItem } from '@/app/utils/createDatabaseBucketItem';
import { checkDemoLimit } from '@/app/utils/demoLimit';
import { IMAGE_MODEL_PRICING } from '@/utils/constants';
import { circleDeveloperSdk } from '@/utils/developer-controlled-wallets-client';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      console.error('Unauthorized', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { canGenerate, remaining } = await checkDemoLimit(user.id);
    if (!canGenerate) {
      return NextResponse.json(
        { error: 'Demo limit reached', remaining },
        { status: 403 },
      );
    }

    const {
      prompt,
      aspect_ratio,
      output_quality,
      provider,
      chat_id,
      circle_wallet_id,
    } = await request.json();

    const response = await circleDeveloperSdk.getWalletTokenBalance({
      id: circle_wallet_id,
      includeAll: true,
    });

    const parsedAmount = response.data?.tokenBalances?.find(
      ({ token }: { token: { symbol?: string } }) => token.symbol === 'USDC',
    )?.amount;

    if (
      !parsedAmount ||
      parseInt(parsedAmount) - IMAGE_MODEL_PRICING.userBilledPrice < 0
    ) {
      console.log('Insufficient wallet balance');
      return NextResponse.json(
        { error: 'Insufficient wallet balance' },
        { status: 400 },
      );
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const model = 'black-forest-labs/flux-schnell';

    const input = {
      prompt,
      go_fast: true,
      megapixels: '1',
      num_outputs: 1,
      aspect_ratio: aspect_ratio,
      output_format: 'webp',
      output_quality: output_quality,
      num_inference_steps: 4,
    };

    const output = (await replicate.run(model, { input })) as string[];
    const imageUrl = output[0];
    if (!imageUrl) {
      throw new Error(
        'No image URL returned from Replicate. Please try again later.',
      );
    }

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(
        `Failed to fetch the generated image from URL: ${imageUrl}`,
      );
    }
    const imageBlob = await imageResponse.blob();
    const bucketData = await createDatabaseBucketItem(
      imageBlob,
      'user-images',
      `${user.id}_${uuidv4()}.webp`,
      'image/webp',
      '3600',
    );
    const storedImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketData?.data?.fullPath}`;

    return NextResponse.json(
      {
        prompt,
        url: storedImageUrl,
        provider: provider,
        chat_id: chat_id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 },
    );
  }
}
