import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
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

    const { prompt, provider, chat_id, circle_wallet_id, output_quality } =
      await request.json();

    const response = await circleDeveloperSdk.getWalletTokenBalance({
      id: circle_wallet_id,
      includeAll: true,
    });

    const parsedAmount = response.data?.tokenBalances?.find(
      ({ token }: { token: { symbol?: string } }) => token.symbol === 'USDC',
    )?.amount;

    if (
      !parsedAmount ||
      parseInt(parsedAmount) -
        IMAGE_MODEL_PRICING[provider as keyof typeof IMAGE_MODEL_PRICING]
          .userBilledPrice <
        0
    ) {
      console.log('Insufficient wallet balance');
      return NextResponse.json(
        { error: 'Insufficient wallet balance' },
        { status: 400 },
      );
    }

    let imageUrl = undefined;

    if (provider === 'openai') {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const model = 'dall-e-3';

      const imageGenerationResponse = await openai.images.generate({
        model: model,
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url',
      });

      imageUrl = imageGenerationResponse.data?.[0].url;
    } else if (provider === 'flux') {
      const replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN,
      });

      const model = 'black-forest-labs/flux-schnell';

      const input = {
        prompt,
        go_fast: true,
        megapixels: '1',
        num_outputs: 1,
        output_format: 'webp',
        output_quality: output_quality,
        num_inference_steps: 4,
      };

      const output = (await replicate.run(model, { input })) as string[];
      imageUrl = output[0];
    }

    if (!imageUrl) {
      throw new Error(
        'No image URL returned from OpenAI. Please try again later.',
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
      'image/png',
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
