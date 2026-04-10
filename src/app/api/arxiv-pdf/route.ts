import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id parameter required" }, { status: 400 });
  }

  try {
    const pdfUrl = `https://arxiv.org/pdf/${id}.pdf`;
    const response = await fetch(pdfUrl, {
      headers: { "User-Agent": "PaperWalk/0.5" },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `arXiv PDF returned ${response.status}` },
        { status: response.status }
      );
    }

    const pdfBuffer = await response.arrayBuffer();
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${id}.pdf"`,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch PDF";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
