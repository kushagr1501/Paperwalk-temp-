export interface ArxivMetadata {
  title: string;
  authors: string[];
  abstract: string;
  year: string;
  venue: string;
  arxivId: string;
  pdfUrl: string;
}

/**
 * Parse arXiv Atom XML into structured metadata.
 */
function parseArxivXML(xml: string): ArxivMetadata | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const entry = doc.querySelector("entry");
  if (!entry) return null;

  const title = entry.querySelector("title")?.textContent?.replace(/\s+/g, " ").trim() || "";
  const abstract = entry.querySelector("summary")?.textContent?.replace(/\s+/g, " ").trim() || "";
  const published = entry.querySelector("published")?.textContent || "";
  const year = published ? new Date(published).getFullYear().toString() : "";

  const authors: string[] = [];
  entry.querySelectorAll("author name").forEach((el) => {
    if (el.textContent) authors.push(el.textContent.trim());
  });

  // Extract arXiv ID from the entry id URL
  const idUrl = entry.querySelector("id")?.textContent || "";
  const idMatch = idUrl.match(/(\d{4}\.\d{4,5})/);
  const arxivId = idMatch ? idMatch[1] : "";

  // Get venue from journal_ref or arxiv primary category
  const journalRef = entry.querySelector("journal_ref")?.textContent?.trim() || "";
  const category = entry.querySelector("primary_category")?.getAttribute("term") || "";
  const venue = journalRef || `arXiv ${year} [${category}]`;

  return {
    title,
    authors,
    abstract,
    year,
    venue,
    arxivId,
    pdfUrl: `https://arxiv.org/pdf/${arxivId}.pdf`,
  };
}

/**
 * Fetch arXiv metadata through our proxy.
 */
export async function fetchArxivMetadata(id: string): Promise<ArxivMetadata> {
  const response = await fetch(`/api/arxiv?id=${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch arXiv metadata: ${response.status}`);
  }
  const xml = await response.text();
  const meta = parseArxivXML(xml);
  if (!meta) {
    throw new Error("Failed to parse arXiv metadata. Check the arXiv ID.");
  }
  return meta;
}

/**
 * Fetch PDF binary through our proxy for client-side pdfjs extraction.
 */
export async function fetchArxivPDF(id: string): Promise<ArrayBuffer> {
  const response = await fetch(`/api/arxiv-pdf?id=${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch arXiv PDF: ${response.status}`);
  }
  return response.arrayBuffer();
}
