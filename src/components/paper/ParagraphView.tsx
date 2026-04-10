"use client";

import { useEffect, useState } from "react";
import { usePaperStore } from "@/stores/paper";
import { streamLLMResponse } from "@/lib/anthropic";
import { buildParagraphWalkthroughPrompt } from "@/lib/prompts/paragraph-walkthrough";
import { buildSystemPrompt } from "@/lib/prompts/system-prefix";
import { TermTooltip } from "@/components/ui/TermTooltip";
import type { TermMap } from "@/types/paper";

interface ParagraphViewProps {
  paragraph: string;
  sectionId: string;
  paragraphIndex: number;
  termMap: TermMap;
  phraseMap: TermMap;
}

export function ParagraphView({
  paragraph,
  sectionId,
  paragraphIndex,
  termMap,
  phraseMap,
}: ParagraphViewProps) {
  const store = usePaperStore();
  const walkthroughKey = `${sectionId}-p${paragraphIndex}`;
  const existingWalkthrough = store.paragraphWalkthroughs[walkthroughKey];
  const [walkthrough, setWalkthrough] = useState(existingWalkthrough || "");
  const [loading, setLoading] = useState(!existingWalkthrough);

  useEffect(() => {
    if (existingWalkthrough || !store.userContext) return;

    let cancelled = false;
    setLoading(true);

    streamLLMResponse(
      [
        {
          role: "user",
          content: buildParagraphWalkthroughPrompt(paragraph, store.userContext),
        },
      ],
      buildSystemPrompt(store.userContext),
      (chunk) => {
        if (!cancelled) setWalkthrough((prev) => prev + chunk);
      },
      (fullText) => {
        if (!cancelled) {
          store.setParagraphWalkthrough(walkthroughKey, fullText);
          setLoading(false);
        }
      }
    ).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [sectionId, paragraphIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderWithTooltips = (text: string) => {
    const allTerms = { ...termMap, ...phraseMap };
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
            sectionId={sectionId}
            context={paragraph}
          >
            {part}
          </TermTooltip>
        );
      }
      return part;
    });
  };

  return (
    <div className="mb-14">
      {/* Original text */}
      <p className="font-serif text-[17px] text-textpri leading-[1.9] mb-6">
        {renderWithTooltips(paragraph)}
      </p>

      {/* Walkthrough panel */}
      <div className="pl-5 border-l-2 border-accent/30 py-1">
        <div className="font-sans text-[10px] text-accent tracking-[0.15em] uppercase mb-3 font-medium">
          Walkthrough
        </div>
        <div className="text-[15px] text-textsec leading-relaxed font-serif whitespace-pre-wrap">
          {walkthrough}
          {loading && <span className="animate-pulse text-accent">&#9646;</span>}
        </div>
      </div>
    </div>
  );
}
