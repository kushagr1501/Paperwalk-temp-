import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id parameter required" }, { status: 400 });
  }

  try {
    // Fetch arXiv Atom feed for metadata
    const response = await fetch(`https://export.arxiv.org/api/query?id_list=${id}`, {
      headers: { "User-Agent": "PaperWalk/0.5" },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `arXiv returned ${response.status}` },
        { status: response.status }
      );
    }

    const xml = await response.text();
    return new NextResponse(xml, {
      headers: { "Content-Type": "application/xml" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch arXiv";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
