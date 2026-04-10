import type { UserContext } from "@/types/paper";

export function buildParagraphWalkthroughPrompt(
  paragraph: string,
  ctx: UserContext
): string {
  const langNote =
    ctx.nativeLanguage !== "English"
      ? `\nCRITICAL: User's native language is ${ctx.nativeLanguage}. Use sentences of 15 words or fewer. No idioms.`
      : "";

  return `Paragraph from the paper:
"""
${paragraph}
"""

User level: ${ctx.backgroundLevel}. Native language: ${ctx.nativeLanguage}.${langNote}

Do the following:

1. Begin with exactly: "This paragraph states that..."
   Complete the sentence in plain English.

2. Explain the meaning sentence by sentence.
   Use concrete language. Define every technical term inline.
   Do not use academic prose. Do not use passive voice where active is clearer.
   Do not write "the authors show" — write what the thing actually does.

3. If this paragraph makes a claim:
   State in one sentence what evidence or experiment supports it.
   If this paragraph introduces a concept:
   Give one concrete real-world example of that concept.

4. In one sentence: how does this paragraph connect to the paper's main argument?

Return ONLY the walkthrough text. No JSON. No markdown headers. Just the explanation text.`;
}
