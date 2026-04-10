import type { UserContext } from "@/types/paper";

export function buildCodeLabPrompt(
  sectionText: string,
  equationsList: string,
  ctx: UserContext
): string {
  return `Section text:
"""
${sectionText.slice(0, 8000)}
"""

Equations in this section: ${equationsList || "none"}
User's language: ${ctx.programmingLanguage}. Background: ${ctx.backgroundLevel}.

Generate working code implementing the core idea of this section.

Return ONLY valid JSON — no markdown, no code fences, no explanation outside the JSON:
{
  "description": "One sentence: what does this code implement?",
  "paper_language": "python",
  "code_blocks": [
    {
      "id": "unique_id",
      "label": "What this block implements",
      "code": "the code — use only numpy, scipy, math for Python. No torch or tensorflow.",
      "annotation": "1-2 sentences: how this block connects to the equation or method above. Reference equation labels."
    }
  ],
  "user_language_code": "If user language differs from Python, provide equivalent code in their language. Otherwise null.",
  "language_note": "If the paper's language differs from user's: one sentence explaining the conceptual translation. Otherwise null."
}

Rules:
- Every line implementing an equation: comment with # Eq. (N) or // Eq. (N)
- Variable names must match paper notation where possible (Q, K, V for attention, etc.)
- Python: use only numpy, scipy, math — no torch or tensorflow
- Include test data and print statements so the code produces visible output when run
- Code must be complete and runnable`;
}
