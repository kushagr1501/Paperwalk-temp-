import type { ParsedSection, UserContext } from "@/types/paper";

export function buildQuizPrompt(
  title: string,
  sections: ParsedSection[],
  ctx: UserContext
): string {
  const sectionBriefs = sections
    .map((s) => `${s.heading}: ${s.body.slice(0, 800)}`)
    .join("\n\n");

  return `Generate a 10-question self-test quiz for this paper.

Paper: "${title}"
User background: ${ctx.backgroundLevel}

Section briefs:
${sectionBriefs}

Return ONLY valid JSON — no markdown, no code fences:
{
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "question": "The question text",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "explanation": "Why A is correct and others are not. Reference the section.",
      "section": "§1"
    },
    {
      "id": "q7",
      "type": "short",
      "question": "Short answer question text",
      "model_answer": "The expected answer",
      "key_concepts": ["concept1", "concept2"],
      "section": "§3"
    },
    {
      "id": "q10",
      "type": "open",
      "question": "Describe the [architecture/method] from this paper in your own words.",
      "key_concepts": ["concept1", "concept2", "concept3"],
      "section": "§4"
    }
  ]
}

Rules:
- 6 MCQ questions (type "mcq"): 4 options each, one correct. Plausible distractors.
- 3 short answer questions (type "short"): free text. Include model_answer and key_concepts.
- 1 open description question (type "open"): conceptual, not wording-based.
- Questions should cover different sections of the paper.
- No "trick questions". Test understanding, not memorization.
- Include section references.`;
}

export function buildQuizEvalPrompt(
  question: string,
  userAnswer: string,
  modelAnswer?: string,
  keyConcepts?: string[]
): string {
  return `Question: "${question}"
User's answer: "${userAnswer}"
${modelAnswer ? `Model answer: "${modelAnswer}"` : ""}
${keyConcepts ? `Key concepts to check for: ${keyConcepts.join(", ")}` : ""}

Evaluate the answer. Return ONLY valid JSON:
{
  "correct": true,
  "explanation": "What the user identified correctly. What was missing. What to focus on. Reference the relevant section. Never say just 'correct' or 'wrong'."
}`;
}
