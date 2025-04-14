import type { NextRequest } from 'next/server';
import { NextResponse } from "next/server";

import { createClient as createSupabaseBrowserClient } from '@/utils/supabase/client'; 
import { createClient } from "@/utils/supabase/server";

const NOVITA_API_URL = "https://api.novita.ai/v3/async/task-result";
const NOVITA_API_KEY = process.env.NEXT_PUBLIC_NOVITA_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.error("Unauthorized", error);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { task_id } = await request.json();

    const { data: videoGeneration, error: dbError } = await supabase
      .from("video_generations")
      .select("*")
      .eq("task_id", task_id)
      .eq("user_id", user.id)
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Could not retrieve video generation" },
        { status: 500 },
      );
    }

    const novitaResponse = await fetch(`${NOVITA_API_URL}?task_id=${task_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Novita-API-Key": NOVITA_API_KEY as string,
      },
    });

    const data = await novitaResponse.json();
    if (!novitaResponse.ok) {
      console.error("Error from Novita API:", data);

      await supabase
        .from("video_generations")
        .update({
          processing_status: "failed",
          error_message: data.message || "Generation failed",
        })
        .eq("id", videoGeneration.id);

      return NextResponse.json(
        { error: "Error checking video status" },
        { status: 500 },
      );
    }

    const status = data.status;
    const videos = data.videos || [];

    if (videos.length > 0) {
      const supabaseStorageClient = createSupabaseBrowserClient(); 
      const video = await fetch(videos[0].video_url);
      const videoBlob = await video.blob();

      const fileName = `${task_id}.mp4`;
      const filePath = `videos/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("video-gen") 
        .upload(filePath, videoBlob, {
          cacheControl: "3600",
          upsert: false,
        });

      let publicUrlData;
      if (!uploadError) {
        const { data } = supabase.storage
          .from("video-gen") 
          .getPublicUrl(uploadData?.path);
        publicUrlData = data;
      }

      await supabase
        .from("video_generations")
        .update({
          processing_status: "completed",
          video_url: publicUrlData?.publicUrl || videos[0].video_url,
        })
        .eq("id", videoGeneration.id);

      return NextResponse.json({ status, videos });
    }

    return NextResponse.json({ status });
  } catch (error) {
      console.error("Could not retrieve video:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Generation failed" },
        { status: 500 }
      );
    }
}
