import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const replicateUrl =
      'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions';

    const response = await fetch(replicateUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        Prefer: 'wait',
      },
      body: JSON.stringify({
        input: {
          prompt,
          go_fast: true,
          megapixels: '1',
          num_outputs: 1,
          aspect_ratio: '1:1',
          output_format: 'webp',
          output_quality: 80,
          num_inference_steps: 4,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Replicate API Error: ${response.statusText}`);
    }

    const responseData = await response.json();
    const imageUrl = responseData?.output?.[0] || null;
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
    const { data: storageData, error: storageError } = await supabase.storage
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

    console.log('returning imageurl', storedImageUrl);

    return NextResponse.json({ imageUrl: storedImageUrl });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 },
    );
  }
}
