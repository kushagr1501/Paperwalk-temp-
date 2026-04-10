import type { UserContext } from "@/types/paper";

export function buildMathDecoderPrompt(
  equationLatex: string,
  equationLabel: string,
  surroundingText: string,
  ctx: UserContext
): string {
  return `Equation from the paper:
LaTeX: ${equationLatex}
Label: ${equationLabel}
Context (the paragraph containing it): ${surroundingText.slice(0, 3000)}

User level: ${ctx.backgroundLevel}. Programming language: ${ctx.programmingLanguage}.

Return ONLY valid JSON — no markdown, no code fences, no explanation outside the JSON:
{
  "name": "Common name for this equation (or 'Unnamed' if none)",
  "what_it_computes": "One sentence: what does this equation calculate?",
  "symbol_breakdown": [
    { "symbol": "exact LaTeX symbol", "meaning": "plain English — what this symbol represents" }
  ],
  "worked_example": {
    "setup": "Concrete small example — specific numbers, specific scenario",
    "steps": [
      "Step 1: [arithmetic operation]. [Name any rule or property used.]",
      "Step 2: ...",
      "Result: [final value, with units if applicable]"
    ]
  },
  "plot_data": {
    "should_plot": true,
    "x": [0.01, 0.1, 0.3, 0.5, 0.7, 0.9, 0.99],
    "y": [4.6, 2.3, 1.2, 0.69, 0.36, 0.1, 0.01],
    "xlabel": "axis label",
    "ylabel": "axis label",
    "title": "descriptive chart title"
  }
}

Rules:
- symbol_breakdown: include EVERY symbol — summation, subscripts, superscripts, Greek letters.
- worked_example: use small, real numbers. Write out every arithmetic step. If a step uses a mathematical property, name that property.
- plot_data.should_plot: true only if the equation describes a relationship worth visualizing (loss functions, activations, etc.). False for simple definitions.
- The worked example must be followable by someone who cannot solve this equation from memory.`;
}
