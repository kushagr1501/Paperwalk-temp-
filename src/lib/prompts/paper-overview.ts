/**
 * LLM prompt for generating paper overview: core contribution + tags.
 */
export function buildOverviewPrompt(title: string, abstract: string): string {
  return `Paper title: "${title}"

Abstract: "${abstract}"

Return ONLY valid JSON — no markdown, no code fences:
{
  "core_contribution": "One sentence, max 25 words: what is this paper's core contribution?",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Rules:
- core_contribution must be factual, specific, and under 25 words.
- tags: max 5, short domain labels (e.g. "LLM", "Fine-tuning", "RLHF", "Safety").
- Do not use the word "summary" or "summarise".`;
}
