"use client";

import { useState } from "react";
import { usePaperStore } from "@/stores/paper";

interface TermTooltipProps {
  term: string;
  definition: string;
  sectionId?: string;
  context?: string;
  children?: React.ReactNode;
}

export function TermTooltip({
  term,
  definition,
  sectionId,
  context,
  children,
}: TermTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const addGlossaryEntry = usePaperStore((s) => s.addGlossaryEntry);

  const handleClick = () => {
    addGlossaryEntry(term.toLowerCase(), {
      term,
      definition,
      firstSeenSection: sectionId || "abstract",
      exampleSentence: context || "",
    });
  };

  return (
    <span
      className="relative inline-block border-b-[1.5px] border-dotted border-accent cursor-help"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={handleClick}
    >
      {children || term}
      {showTooltip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-surface border border-bordercolor p-3 rounded-lg shadow-lg z-50 text-left pointer-events-none">
          <span className="block font-sans text-xs text-accent mb-1 font-medium">
            {term}
          </span>
          <span className="block font-serif text-sm text-textsec leading-relaxed">
            {definition}
          </span>
        </span>
      )}
    </span>
  );
}
