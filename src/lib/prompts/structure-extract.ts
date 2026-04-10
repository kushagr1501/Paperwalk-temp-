/**
 * LLM prompt for extracting structured paper content from raw text.
 */
export const STRUCTURE_EXTRACT_PROMPT = `Extract the structure of this research paper and return as JSON.

Return ONLY valid JSON — no markdown formatting, no code fences, no explanation outside the JSON.

{
  "title": "paper title",
  "authors": ["author1", "author2"],
  "abstract": "full abstract text",
  "sections": [
    {
      "id": "s1",
      "heading": "1. Introduction",
      "body": "full section text — include every paragraph",
      "equations": [
        { "id": "eq1", "latex": "L = -\\\\sum_i y_i \\\\log(\\\\hat{y}_i)", "label": "(1)" }
      ],
      "has_algorithm": true
    }
  ],
  "reading_order_hints": [
    {
      "section_id": "s3",
      "type": "read-first",
      "text": "Read §2 first",
      "reason": "Section 2 defines terms used throughout Section 3"
    }
  ]
}

Rules:
- Include EVERY section of the paper, including Introduction and Conclusion.
- Provide a clear, comprehensive summary of each section's body text (do not truncate important details, but avoid copying verbatim if it exceeds 1000 words per section).
- Extract ALL equations with their LaTeX. Use double backslashes for LaTeX commands.
- Mark has_algorithm as true if the section describes a method, algorithm, or procedure that can be coded.
- For reading_order_hints, type must be one of: "read-first", "dense-equations", "forward-ref".
- If a section has 3+ equations, add a "dense-equations" hint.
- If a section references a later section, add a "forward-ref" hint.
- Output MUST be completely valid JSON and must not be truncated. Be concise if necessary to ensure the JSON successfully closes.`;

export function buildStructureExtractionMessage(paperText: string): string {
  // Truncate if extremely long to fit context window
  const maxChars = 80000;
  const text = paperText.length > maxChars
    ? paperText.slice(0, maxChars) + "\n\n[Text truncated for length]"
    : paperText;

  return `Here is the full text of the research paper:\n\n---\n\n${text}\n\n---\n\nExtract the structure as specified.`;
}
