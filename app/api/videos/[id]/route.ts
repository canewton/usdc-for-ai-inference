import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/client";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const videoId = params.id;
  const supabase = await createClient();

  try {
    const token = req.headers.get('Authorization');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token.split(' ')[1]);

    if (error || !user) {
      console.error('Unauthorized', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get full details of the specific video generation
    const { data: videoGeneration, error: dbError } = await supabase
      .from('video_generations')
      .select('*')
      .eq('id', videoId)
      .eq('user_id', user.id)
      .single();

    if (dbError) {
      console.error('Error fetching video generation:', dbError);
      return NextResponse.json(
        { error: 'Video generation not found or access denied' }, 
        { status: dbError.code === 'PGRST116' ? 404 : 500 }
      );
    }

    return NextResponse.json({ videoGeneration });
  } catch (error) {
    console.error('Error retrieving video details:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve video details' },
      { status: 500 },
    );
  }
}