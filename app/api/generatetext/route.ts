import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Parse req body
    const { messages, model } = await req.json();

    // Get result
    const result = streamText({
      model: openai(model),
      messages,
    });

    // Return result
    return result.toDataStreamResponse();
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate text' },
      { status: 500 },
    );
  }
}
