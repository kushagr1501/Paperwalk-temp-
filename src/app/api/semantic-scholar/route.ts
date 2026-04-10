import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://api.semanticscholar.org/graph/v1";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const limit = searchParams.get("limit") || "20";

  if (!query) {
    return NextResponse.json({ error: "query parameter required" }, { status: 400 });
  }

  try {
    const params = new URLSearchParams({
      query,
      fields: "title,authors,year,abstract,citationCount,externalIds,venue",
      limit,
    });

    const response = await fetch(`${BASE_URL}/paper/search?${params}`, {
      headers: { "User-Agent": "PaperWalk/0.5" },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
