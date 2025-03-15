import { NextResponse } from "next/server";
// import { createClient } from "@/utils/supabase/client";
// const supabase = createClient();

const NOVITA_API_URL = 'https://api.novita.ai/v3/async/img2video';
const NOVITA_API_KEY = process.env.NEXT_PUBLIC_NOVITA_API_KEY;

export async function POST(req: Request) {
try{
  const token = req.headers.get("Authorization");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // const {
  //       data: { user },
  //       error,
  //     } = await supabase.auth.getUser(token.split(' ')[1]);
  //     if (error || !user) {
  //       console.error('Unauthorized', error);
  //       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  //     }

  const { model_name, image_file, seed } = await req.json();
  const input = {
    model_name: model_name,
    image_file: image_file,
    frames_num: model_name === 'SVD-XT' ? 25 : 14,
    frames_per_second: 6,
    image_file_resize_mode: "ORIGINAL_RESOLUTION",
    steps: 20,
    seed: seed,
    motion_bucket_id: 1,
    cond_aug: 1,
    enable_frame_interpolation: true,
  }
  const response = await fetch(NOVITA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NOVITA_API_KEY}`,
    },
    body: JSON.stringify(input),
  });
  const data = await response.json();
  if (!response.ok) {
    console.error('Error from Novita API:', data);
    return NextResponse.json({ error: 'Error from Novita API' }, { status: 500 });
  }
  const { task_id } = data;
  console.log('Task ID:', task_id);
  return NextResponse.json({ task_id });
}
  catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 },
    );
}
}