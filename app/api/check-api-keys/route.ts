import { NextResponse } from "next/server"

export async function GET() {
  const apiKeyStatus = {
    openai: process.env.OPENAI_API_KEY ? true : false,
    replicate: process.env.REPLICATE_API_TOKEN ? true : false,
    meshy: process.env.MESHY_API_URL ? true : false,
    video: process.env.VIDEO_API_KEY ? true : false,
  }

  return NextResponse.json({ apiKeyStatus })
}