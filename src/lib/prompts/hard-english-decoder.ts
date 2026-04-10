export function buildHardEnglishDecoderPrompt(text: string): string {
  return `Analyse this text from a research paper and identify technical terms and academic phrases that need decoding.

Text:
"""
${text.slice(0, 8000)}
"""

Return ONLY valid JSON — no markdown, no code fences:
{
  "term_map": {
    "technical term": "plain English definition — concrete, not circular",
    "another term": "its definition"
  },
  "phrase_map": {
    "academic phrase": "plain English equivalent",
    "it can be shown that": "we can mathematically prove (derivation omitted here) that"
  }
}

Rules:
- Include every technical term, acronym, and jargon word.
- Include phrases like "state-of-the-art", "empirically demonstrate", "it follows that", "outperforms baselines".
- Definitions must be specific. Not "a type of function" but "a function that converts raw numbers into probabilities between 0 and 1".
- If an acronym appears, expand it AND explain it.`;
}
