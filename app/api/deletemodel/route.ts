import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function DELETE(request: NextRequest) {
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

    const url = new URL(request.url);
    const modelid = url.searchParams.get("modelid");
    
    if (!modelid) {
      return NextResponse.json({ error: "Missing model_id" }, { status: 400 });
    }

    const { error: deletedbError } = await supabase
      .from("3d_generations")
      .delete()
      .eq("id", modelid)
      .eq("user_id", user.id);

    if (deletedbError) {
      return NextResponse.json(
        { error: deletedbError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Model deleted successfully " });
  } catch (error: any) {
    console.error("3D Generation error:", error);
    return NextResponse.json(
      { error: error.message || "3D Generation failed" },
      { status: 500 },
    );
  }
}
