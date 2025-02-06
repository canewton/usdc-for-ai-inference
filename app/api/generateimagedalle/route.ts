import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { v4 as uuidv4 } from 'uuid';

import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const model = 'black-forest-labs/flux-schnell';

    const input = {
      prompt,
      go_fast: true,
      megapixels: '1',
      num_outputs: 1,
      aspect_ratio: '1:1',
      output_format: 'webp',
      output_quality: 80,
      num_inference_steps: 4,
    };

    const output = (await replicate.run(model, { input })) as string[];
    const imageUrl = output[0];
    if (!imageUrl) {
      throw new Error('No image URL returned from Replicate');
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
      .from('user-images')
      .upload(fileName, imageBlob, {
        contentType: 'image/webp',
      });

    if (storageError) {
      throw new Error(
        `Error uploading image to Supabase: ${storageError.message}`,
      );
    }

    const { data: publicURLData } = supabase.storage
      .from('user-images')
      .getPublicUrl(fileName);

    if (!publicURLData.publicUrl) {
      throw new Error('Failed to retrieve public URL for image');
    }

    const storedImageUrl = publicURLData.publicUrl;

    const { error: dbError } = await supabase.from('image_generations').insert([
      {
        prompt,
        user: 'example-user',
        url: storedImageUrl,
        provider: 'Replicate',
      },
    ]);

    if (dbError) {
      throw new Error(
        `Error inserting record into Supabase: ${dbError.message}`,
      );
    }

    return NextResponse.json({ imageUrl: storedImageUrl });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 },
    );
  }
}
