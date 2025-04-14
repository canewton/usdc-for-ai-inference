import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Unauthorized", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse JSON array from query param
    const url = new URL(request.url);
    const imageids = url.searchParams.get("imageids");
    // Fetch images by id
    if (imageids) {
      const ids = JSON.parse(imageids);
      const { data: images, error } = await supabase
        .from("image_generations")
        .select("id, url, prompt, created_at")
        .eq("user_id", user.id)
        .in("id", ids);

      if (error) {
        console.error("Database error:", error);
        return NextResponse.json(
          { error: "Failed to fetch images" },
          { status: 500 },
        );
      }

      return NextResponse.json({ images: images }, { status: 200 });
    } else {
      // Fetch all of user's images
      const { data: images, error } = await supabase
        .from("image_generations")
        .select("id, url, prompt, created_at")
        .eq("user_id", user.id);

      if (error) {
        console.error("Database error:", error);
        return NextResponse.json(
          { error: "Failed to fetch images" },
          { status: 500 },
        );
      }

      return NextResponse.json({ images: images }, { status: 200 });
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
