"use client";

import { useEffect, useState } from "react";
import { usePaperStore } from "@/stores/paper";
import { callLLMJSON } from "@/lib/anthropic";
import { buildAbstractWalkthroughPrompt } from "@/lib/prompts/abstract-walkthrough";
import { buildSystemPrompt } from "@/lib/prompts/system-prefix";
import { TermTooltip } from "@/components/ui/TermTooltip";

interface AbstractViewProps {
  onContinue: () => void;
}

interface AbstractWalkthrough {
  what_problem: string;
  approach: string;
  results: string;
  analogy: string;
  term_map: Record<string, string>;
  phrase_map: Record<string, string>;
}

export function AbstractView({ onContinue }: AbstractViewProps) {
  const store = usePaperStore();
  const [walkthrough, setWalkthrough] = useState<AbstractWalkthrough | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store.metadata || !store.userContext) return;

    async function loadWalkthrough() {
      try {
        const result = await callLLMJSON<AbstractWalkthrough>(
          [
            {
              role: "user",
              content: buildAbstractWalkthroughPrompt(
                store.metadata!.abstract,
                store.userContext!
              ),
            },
          ],
          buildSystemPrompt(store.userContext!)
        );
        setWalkthrough(result);
      } catch {
        setWalkthrough({
          what_problem: "Could not generate walkthrough. Check your API key.",
          approach: "",
          results: "",
          analogy: "",
          term_map: {},
          phrase_map: {},
        });
      } finally {
        setLoading(false);
      }
    }

    loadWalkthrough();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const renderAbstractWithTooltips = (text: string) => {
    if (!walkthrough) return text;

    const allTerms = {
      ...walkthrough.term_map,
      ...walkthrough.phrase_map,
    };

    const termKeys = Object.keys(allTerms).sort(
      (a, b) => b.length - a.length
    );

    if (termKeys.length === 0) return text;

    const escapedTerms = termKeys.map((t) =>
      t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );
    const regex = new RegExp(`(${escapedTerms.join("|")})`, "gi");

    const parts = text.split(regex);
    return parts.map((part, i) => {
      const matchedTerm = termKeys.find(
        (t) => t.toLowerCase() === part.toLowerCase()
      );
      if (matchedTerm) {
        return (
          <TermTooltip
            key={i}
            term={matchedTerm}
            definition={allTerms[matchedTerm]}
            sectionId="Abstract"
            context={text}
          >
            {part}
          </TermTooltip>
        );
      }
      return part;
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="font-serif text-base text-textmuted italic animate-pulse">
          Walking through the abstract...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-8 py-14">
      <h2 className="font-serif text-3xl font-medium text-textpri mb-10">
        Abstract
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-14">
        {/* Left: Original abstract */}
        <div>
          <div className="font-sans text-xs text-textmuted uppercase tracking-wider mb-4">
            Original
          </div>
          <p className="font-serif text-[17px] text-textpri leading-[1.9]">
            {renderAbstractWithTooltips(store.metadata?.abstract || "")}
          </p>
        </div>

        {/* Right: Walkthrough */}
        {walkthrough && (
          <div className="space-y-6">
            {walkthrough.what_problem && (
              <div>
                <div className="font-sans text-xs text-accent uppercase tracking-wider mb-2">
                  What problem does this paper address?
                </div>
                <p className="font-serif text-[15px] text-textsec leading-relaxed">
                  {walkthrough.what_problem}
                </p>
              </div>
            )}
            {walkthrough.approach && (
              <div>
                <div className="font-sans text-xs text-accent uppercase tracking-wider mb-2">
                  What is their approach?
                </div>
                <p className="font-serif text-[15px] text-textsec leading-relaxed">
                  {walkthrough.approach}
                </p>
              </div>
            )}
            {walkthrough.results && (
              <div>
                <div className="font-sans text-xs text-accent uppercase tracking-wider mb-2">
                  What did they show?
                </div>
                <p className="font-serif text-[15px] text-textsec leading-relaxed">
                  {walkthrough.results}
                </p>
              </div>
            )}
            {walkthrough.analogy && (
              <div>
                <div className="font-sans text-xs text-accent uppercase tracking-wider mb-2">
                  One analogy
                </div>
                <p className="font-serif text-[15px] text-textsec leading-relaxed italic">
                  {walkthrough.analogy}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={onContinue}
        className="w-full bg-accent text-white font-sans text-base py-4 rounded-lg hover:bg-accent-dim transition-colors"
      >
        Begin section walkthrough &rarr;
      </button>
    </div>
  );
}
