/**
 * LLM prompt for extracting prerequisites from a paper.
 */
export function buildPrerequisitesPrompt(paperText: string): string {
  const maxChars = 40000;
  const text = paperText.length > maxChars
    ? paperText.slice(0, maxChars) + "\n\n[Text truncated]"
    : paperText;

  return `Analyse this research paper and identify the background knowledge it assumes.

Paper text:
---
${text}
---

Return ONLY valid JSON — no markdown, no code fences:
{
  "prerequisites": {
    "maths": [
      "Concept name 1",
      "Concept name 2"
    ],
    "systems": [
      "Concept name 1"
    ],
    "coding": [
      "Concept name 1"
    ]
  }
}

Rules:
- List 3-8 concepts per category.
- Each concept is a short, specific name (e.g. "Softmax function", not "basic math").
- Only include concepts the paper actually assumes the reader knows.
- If a category has no prerequisites, return an empty array for it.
- maths = mathematical concepts, systems = hardware/infrastructure/architecture, coding = programming/implementation concepts.`;
}
