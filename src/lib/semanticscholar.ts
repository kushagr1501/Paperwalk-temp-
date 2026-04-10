export interface SemanticPaper {
  paperId: string;
  title: string;
  authors: { name: string }[];
  year: number | null;
  abstract: string | null;
  citationCount: number;
  venue: string | null;
  externalIds: {
    ArXiv?: string;
    DOI?: string;
  } | null;
}

interface SearchResponse {
  total: number;
  data: SemanticPaper[];
}

/**
 * Search papers via our server-side proxy to Semantic Scholar API.
 */
export async function searchPapers(
  query: string,
  limit: number = 20
): Promise<SemanticPaper[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    query: query.trim(),
    limit: limit.toString(),
  });

  const response = await fetch(`/api/semantic-scholar?${params}`);

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limited. Wait a moment and try again.");
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Search returned ${response.status}`);
  }

  const data: SearchResponse = await response.json();
  return data.data || [];
}
