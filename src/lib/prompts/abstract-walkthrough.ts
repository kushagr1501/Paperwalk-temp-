import type { UserContext } from "@/types/paper";

export function buildAbstractWalkthroughPrompt(
  abstract: string,
  ctx: UserContext
): string {
  const langNote =
    ctx.nativeLanguage !== "English"
      ? `\nCRITICAL: User's native language is ${ctx.nativeLanguage}. Use sentences of 15 words or fewer. No idioms.`
      : "";

  return `Walk through this research paper abstract for a ${ctx.backgroundLevel} reader.${langNote}

Abstract:
"""
${abstract}
"""

Return ONLY valid JSON — no markdown, no code fences:
{
  "what_problem": "2-3 sentences. What problem does this paper address? Concrete. No jargon without definition.",
  "approach": "2-3 sentences. What they actually did — not what they claim.",
  "results": "1-2 sentences. Results, not claims. Specific numbers if available.",
  "analogy": "One analogy: 'This is like [X] applied to [Y].'",
  "term_map": {
    "technical term": "plain English definition"
  },
  "phrase_map": {
    "academic phrase": "plain English equivalent"
  }
}

Rules:
- term_map: include every technical term and acronym in the abstract
- phrase_map: include every academic phrase (e.g. "state-of-the-art", "empirically demonstrate")
- Definitions must be concrete, not circular
- Never use "summarise" or "summary"`;
}
