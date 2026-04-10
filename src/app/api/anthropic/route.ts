import { NextRequest, NextResponse } from "next/server";

const FROG_BASE_URL = "https://frogapi.app/v1";

export const maxDuration = 300; // Allow serverless function to run for up to 5 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, model, system, messages, stream, max_tokens } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    // Build OpenAI-compatible messages array with system message
    const openaiMessages = [
      ...(system ? [{ role: "system" as const, content: system }] : []),
      ...messages,
    ];

    const frogResponse = await fetch(`${FROG_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "gemini-2.5-pro",
        max_tokens: max_tokens || 8192,
        messages: openaiMessages,
        stream: stream ?? true,
      }),
    });

    if (!frogResponse.ok) {
      const errorText = await frogResponse.text();
      return NextResponse.json(
        { error: errorText },
        { status: frogResponse.status }
      );
    }

    if (stream) {
      // Forward the SSE stream
      return new Response(frogResponse.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const data = await frogResponse.json();
    return NextResponse.json({
      text: data.choices?.[0]?.message?.content || "",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
