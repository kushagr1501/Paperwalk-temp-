import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id parameter required" }, { status: 400 });
  }

  try {
    // Try to fetch the HTML abstract page to get PDF link and raw text
    const absResponse = await fetch(`https://arxiv.org/abs/${id}`, {
      headers: { "User-Agent": "PaperWalk/0.5" },
    });

    if (!absResponse.ok) {
      return NextResponse.json(
        { error: `arXiv abs returned ${absResponse.status}` },
        { status: absResponse.status }
      );
    }

    const html = await absResponse.text();

    // Also try to fetch the PDF for text extraction on client
    // We return the abs HTML so the client can extract what it needs
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch source";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
