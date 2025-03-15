import { NextResponse } from "next/server";
// import { createClient } from "@/utils/supabase/client";
// const supabase = createClient();

const NOVITA_API_URL = 'https://api.novita.ai/v3/async/task-result';
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

  const { task_id } = await req.json();

  const response = await fetch(`${NOVITA_API_URL}?task_id=${task_id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NOVITA_API_KEY}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    console.error('Error from Novita API:', data);
    return NextResponse.json({ error: 'Error from Novita API' }, { status: 500 });
  }
  console.log('Task result:', data);
  const taskStatus = data.task?.status;
  const videos = data.videos || [];
  return NextResponse.json({ taskStatus, videos });
}
catch (error) {
  console.error('Could not retrieve video:', error);
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Generation failed' },
    { status: 500 },
  );
}
}