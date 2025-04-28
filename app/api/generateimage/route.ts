import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { v4 as uuidv4 } from 'uuid';

import { checkDemoLimit } from '@/app/utils/demoLimit';
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

    const { prompt, aspect_ratio, output_quality, provider, chat_id } =
      await request.json();

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

    const fileName = `${uuidv4()}.webp`;
    const { error: storageError } = await supabase.storage
      .from('user-images') // Ensure this bucket exists and policies are correct
      .upload(fileName, imageBlob, {
        contentType: 'image/webp',
      });

    if (storageError) {
      console.error('Storage error:', storageError);
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 },
      );
    }

    const { data: publicURLData } = supabase.storage
      .from('user-images') // Use same bucket name
      .getPublicUrl(fileName);

    if (!publicURLData.publicUrl) {
      throw new Error('Failed to retrieve public URL for image');
    }

    const storedImageUrl = publicURLData.publicUrl;

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
