import type { UserContext, ParsedSection, GlossaryEntry } from "@/types/paper";

export function buildFullNotesPrompt(
  title: string,
  sections: ParsedSection[],
  ctx: UserContext,
  glossary: Record<string, GlossaryEntry>
): string {
  const sectionSummaries = sections
    .map((s) => `${s.heading}: ${s.body.slice(0, 500)}...`)
    .join("\n\n");

  const glossaryText = Object.values(glossary)
    .map((g) => `${g.term}: ${g.definition}`)
    .join("\n");

  return `Generate complete reading notes for this paper.

Paper title: "${title}"
User's programming language: ${ctx.programmingLanguage}
User's background: ${ctx.backgroundLevel}

Section overviews:
${sectionSummaries}

Glossary terms collected:
${glossaryText || "None collected yet"}

Generate the notes as Markdown following this exact structure:

# ${title} — Reading notes
## paperwalk · ${new Date().toISOString().split("T")[0]}

## What this paper addresses
[3-4 sentences. The problem, in plain terms. No jargon.]

## Their approach — step by step
1. [Step one, one sentence]
2. [Step two, one sentence]
...

## Key equations
### [Equation name]
- What it computes: [one sentence]
- When it applies: [one sentence]
- Decoded: [symbol = meaning, for each symbol]

## Key algorithm — in ${ctx.programmingLanguage}
[Fully annotated code. Every line commented. Equation references included.]

## Results
[What was measured. What improved. By how much. Specific numbers.]

## What you would need to implement this
[Prerequisites + specific libraries + rough steps. Concrete.]

## Background this paper assumed
[The prerequisite concepts with their plain definitions.]

## Glossary
[Every term alphabetical. Plain definition. First seen in section.]

## Section reference
[One bullet per section: what it covers, in one sentence.]

Return the full Markdown document. No JSON wrapping. Just Markdown.`;
}
