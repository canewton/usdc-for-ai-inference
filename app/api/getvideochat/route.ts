import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { videoId } = await request.json();

    if (!videoId) {
      return NextResponse.json(
        { error: "Missing required parameter: videoId" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.error("Unauthorized", error);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: videoGeneration, error: dbError } = await supabase
      .from("video_generations")
      .select("*")
      .eq("task_id", videoId)
      .eq("user_id", user.id)
      .single();

    if (dbError) {
      console.error("Error fetching video generation:", dbError);
      return NextResponse.json(
        { error: "Video generation not found or access denied" },
        { status: dbError.code === "PGRST116" ? 404 : 500 },
      );
    }

    return NextResponse.json(videoGeneration);
  } catch (error) {
    console.error("Error retrieving video details:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to retrieve video details",
      },
      { status: 500 },
    );
  }
}
