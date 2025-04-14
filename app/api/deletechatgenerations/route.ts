import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export async function DELETE(req: Request) {
  try {
    // Get authenticated user
    const token = req.headers.get("Authorization");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token.split(" ")[1]);
    if (error || !user) {
      console.error("Unauthorized", error);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Get the timestamp for this row
    const { data: row, error: rowError } = await supabase
      .from("chat_generations")
      .select("created_at")
      .eq("id", id)
      .single();

    if (rowError) {
      return NextResponse.json({ error: rowError.message }, { status: 500 });
    }
    console.log(row.created_at);

    // Delete all rows created after this row
    const { data, error: dbError } = await supabase
      .from("chat_generations")
      .delete()
      .eq("user_id", user.id)
      .gte("created_at", row.created_at);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Chat generations deleted successfully",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
