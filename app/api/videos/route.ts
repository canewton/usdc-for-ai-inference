import type { NextRequest } from 'next/server';
import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
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

    const { data: videoGenerations, error: dbError } = await supabase
      .from("video_generations")
      .select("id, prompt, task_id, processing_status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (dbError) {
      console.error("Error fetching video generations:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch video generations" },
        { status: 500 },
      );
    }

    return NextResponse.json({ videoGenerations });
  } catch (error) {
    console.error("Error retrieving videos:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to retrieve videos",
      },
      { status: 500 },
    );
  }
}
