import type { UserContext } from "@/types/paper";

export function buildQuickRevisionPrompt(
  concept: string,
  category: "maths" | "systems" | "coding",
  ctx: UserContext
): string {
  return `Explain this concept for a ${ctx.backgroundLevel} reader whose programming language is ${ctx.programmingLanguage}${ctx.nativeLanguage !== "English" ? ` and whose native language is ${ctx.nativeLanguage} (use sentences of 15 words or fewer, no idioms)` : ""}.

Concept: "${concept}" (category: ${category})

Return ONLY valid JSON — no markdown, no code fences:
{
  "explanation": "4-6 sentences. Plain language. No jargon without definition.",
  "analogy": "One concrete real-world analogy.",
  "worked_example": "A worked example with small specific numbers. Every arithmetic step written out explicitly.",
  "self_check_question": "One question the reader can answer to check understanding. Free text answer expected."
}

Rules:
- Do not say "simply", "just", "obviously", or "as you know".
- Do not celebrate or encourage.
- Be concrete and specific.`;
}

export function buildSelfCheckEvalPrompt(
  concept: string,
  question: string,
  userAnswer: string
): string {
  return `Concept: "${concept}"
Question asked: "${question}"
User's answer: "${userAnswer}"

Evaluate this answer. Return ONLY valid JSON:
{
  "evaluation": "What was correct in the answer, what was missing, and what to focus on. Be specific. Never say 'correct' or 'wrong' as standalone feedback. Always explain."
}`;
}
