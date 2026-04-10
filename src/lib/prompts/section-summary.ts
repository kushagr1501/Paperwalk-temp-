export function buildSectionSummaryPrompt(
  sectionHeading: string,
  sectionBody: string,
  nextSectionHeading?: string
): string {
  return `Section: "${sectionHeading}"

Section text:
"""
${sectionBody.slice(0, 10000)}
"""

${nextSectionHeading ? `Next section: "${nextSectionHeading}"` : "This is the final section."}

Return ONLY valid JSON — no markdown, no code fences:
{
  "bullets": ["bullet 1", "bullet 2", "bullet 3"],
  "key_point": "The single most important idea from this section, in one sentence.",
  "forward_pointer": "How this section connects to the next section. Null if last section."
}

Rules:
- 3-5 bullets. Each bullet: one idea, plain English, one sentence.
- key_point: bolded-worthy. The reader remembers this above all else.
- forward_pointer: factual bridge sentence. Null if this is the last section.
- No motivational copy. No celebration. No "great work".`;
}
