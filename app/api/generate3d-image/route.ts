import { NextResponse } from 'next/server';

import { checkDemoLimit } from '@/app/utils/demoLimit';
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

interface TaskStatusResponse {
  status: string;
  progress: number;
  model_urls?: { glb: string };
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
      enable_pbr,
      should_remesh,
      should_texture,
      texture_prompt,
    } = await req.json();

    const { canGenerate, remaining } = await checkDemoLimit(user.id);
    if (!canGenerate) {
      return NextResponse.json(
        { error: 'Demo limit reached. Please upgrade to continue.' },
        { status: 429 },
      );
    }

    const generatePreviewResponse = await fetch(MESHY_API_URL, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        image_url,
        enable_pbr,
        should_remesh,
        should_texture,
        texture_prompt,
      }),
    });

    if (!generatePreviewResponse.ok) {
      throw new Error('Failed to create preview model.');
    }

    const meshyResponse: MeshyResponse = await generatePreviewResponse.json();
    const taskId: string = meshyResponse.result;

    return NextResponse.json({ taskId }, { status: 200 });
  } catch (error) {
    console.error('Error generating 3D model:', error);
    return NextResponse.json(
      { error: 'Failed to generate 3D model' },
      { status: 500 },
    );
  }
}
