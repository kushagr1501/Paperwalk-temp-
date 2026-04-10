import type { UserContext, ParsedSection } from "@/types/paper";

export function buildCodingChallengePrompt(
  sections: ParsedSection[],
  ctx: UserContext
): string {
  // Find the section with the most equations or marked as having an algorithm
  const coreSections = sections.filter((s) => s.hasAlgorithm || s.equations.length > 0);
  const coreSection = coreSections[0] || sections[Math.floor(sections.length / 2)];

  const difficultyMap = {
    beginner: "Implement one helper function from the paper (e.g. softmax, normalize). Keep it simple.",
    intermediate: "Implement the core algorithm from scratch (e.g. full attention mechanism). Moderate complexity.",
    expert: "Extend the algorithm with a variant discussed in the paper. Advanced.",
  };

  return `Generate a coding challenge based on this paper section.

Section: "${coreSection.heading}"
Section text: ${coreSection.body.slice(0, 5000)}
Equations: ${coreSection.equations.map((e) => e.latex).join("; ") || "none"}

User's language: ${ctx.programmingLanguage}
Difficulty: ${ctx.backgroundLevel} — ${difficultyMap[ctx.backgroundLevel]}

Return ONLY valid JSON:
{
  "section_ref": "${coreSection.heading}",
  "task_description": "2-3 lines. What to implement. Plain instruction, no encouragement.",
  "starter_code": "Function signature + docstring. Body is empty for the user to fill.",
  "hints": [
    "Hint 1: Refers to a specific equation or paragraph. E.g. 'Look at equation (3). What does the numerator compute?'",
    "Hint 2: Gives structure. E.g. 'Your function should compute X, then divide by Y, then apply Z.'",
    "Hint 3: Shows skeleton with blanks to fill."
  ],
  "solution_code": "Full working solution with line-by-line comments.",
  "test_code": "Code that tests the solution with sample input and prints results."
}

Rules:
- Code must be in ${ctx.programmingLanguage}.
- For Python: use only numpy, scipy, math. No torch or tensorflow.
- Starter code has function signature and docstring. Body is empty.
- 3 hints exactly, progressively more revealing.
- Solution includes every line commented.`;
}
