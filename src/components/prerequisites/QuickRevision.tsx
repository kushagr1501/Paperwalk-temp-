"use client";

import { useState } from "react";
import { callLLMJSON } from "@/lib/anthropic";
import { buildSelfCheckEvalPrompt } from "@/lib/prompts/quick-revision";
import type { PrerequisiteItem } from "@/types/paper";

interface QuickRevisionProps {
  item: PrerequisiteItem;
}

export function QuickRevision({ item }: QuickRevisionProps) {
  const [selfCheckAnswer, setSelfCheckAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  const rev = item.revisionContent;
  if (!rev) return null;

  const handleSubmitSelfCheck = async () => {
    if (!selfCheckAnswer.trim()) return;
    setEvaluating(true);
    try {
      const result = await callLLMJSON<{ evaluation: string }>(
        [
          {
            role: "user",
            content: buildSelfCheckEvalPrompt(
              item.concept,
              rev.selfCheckQuestion,
              selfCheckAnswer
            ),
          },
        ],
        "You evaluate student answers. Be specific. Never say just 'correct' or 'wrong'. Always explain what was right, what was missing, and what to focus on."
      );
      setEvaluation(result.evaluation);
    } catch {
      setEvaluation("Could not evaluate. Check your API key and try again.");
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="border-t border-bordercolor pt-3 mt-3">
      <p className="font-serif text-sm text-textsec mb-2 leading-relaxed">
        {rev.explanation}
      </p>
      <p className="font-serif text-sm italic text-textmuted mb-4 leading-relaxed">
        {rev.analogy}
      </p>
      <div className="bg-elevated border border-bordercolor p-3 rounded-lg mb-4 font-mono text-xs text-textsec whitespace-pre-wrap leading-relaxed">
        {rev.workedExample}
      </div>

      <label className="block font-sans text-[10px] text-textmuted mb-2 uppercase tracking-[0.15em]">
        Self-check
      </label>
      <p className="font-serif text-sm text-textmuted mb-2">
        {rev.selfCheckQuestion}
      </p>
      <input
        type="text"
        value={selfCheckAnswer}
        onChange={(e) => setSelfCheckAnswer(e.target.value)}
        placeholder="Type your answer..."
        className="w-full bg-surface border border-bordercolor rounded-lg px-3 py-2 text-sm text-textpri outline-none focus:border-accent mb-2 transition-colors font-serif"
        onKeyDown={(e) => e.key === "Enter" && handleSubmitSelfCheck()}
      />
      <button
        onClick={handleSubmitSelfCheck}
        disabled={evaluating || !selfCheckAnswer.trim()}
        className="w-full bg-accent hover:bg-accent-dim text-white font-sans text-xs py-1.5 rounded-lg transition-colors disabled:opacity-40"
      >
        {evaluating ? "Evaluating..." : "Submit answer"}
      </button>

      {evaluation && (
        <div className="mt-3 bg-accent-light border border-accent-dim/20 rounded-lg p-3">
          <p className="font-serif text-sm text-textsec leading-relaxed">
            {evaluation}
          </p>
        </div>
      )}
    </div>
  );
}
