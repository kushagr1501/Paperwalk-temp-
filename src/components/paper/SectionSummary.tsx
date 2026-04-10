"use client";

import { useEffect, useState } from "react";
import { usePaperStore } from "@/stores/paper";
import { callLLMJSON } from "@/lib/anthropic";
import { buildSectionSummaryPrompt } from "@/lib/prompts/section-summary";

interface SectionSummaryData {
  bullets: string[];
  key_point: string;
  forward_pointer: string | null;
}

interface SectionSummaryProps {
  sectionId: string;
  sectionHeading: string;
  sectionBody: string;
  nextSectionHeading?: string;
  onContinue: () => void;
  isLastSection: boolean;
}

export function SectionSummary({
  sectionId,
  sectionHeading,
  sectionBody,
  nextSectionHeading,
  onContinue,
  isLastSection,
}: SectionSummaryProps) {
  const store = usePaperStore();
  const [data, setData] = useState<SectionSummaryData | null>(
    (store.sectionSummaries[sectionId] as SectionSummaryData) || null
  );
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    if (data) return;

    async function load() {
      try {
        const result = await callLLMJSON<SectionSummaryData>(
          [
            {
              role: "user",
              content: buildSectionSummaryPrompt(
                sectionHeading,
                sectionBody,
                nextSectionHeading
              ),
            },
          ],
          "You generate factual section summaries for research papers. No motivational copy. No celebration. Just facts."
        );
        setData(result);
        store.setSectionSummary(sectionId, result);
      } catch {
        setData({
          bullets: ["Section walkthrough complete."],
          key_point: "See above.",
          forward_pointer: null,
        });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [sectionId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mt-16 mb-24 border-t border-bordercolor pt-10">
      <h3 className="font-serif text-xl mb-6 text-textpri text-center">
        Section Complete
      </h3>

      {loading ? (
        <div className="font-serif text-sm text-textmuted italic animate-pulse text-center">
          Generating section review...
        </div>
      ) : data ? (
        <>
          <ul className="space-y-2 mb-8">
            {data.bullets.map((bullet, i) => (
              <li key={i} className="font-serif text-sm text-textsec flex gap-2">
                <span className="text-textmuted flex-shrink-0">&bull;</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          <div className="bg-elevated border border-bordercolor rounded-lg p-4 mb-8">
            <div className="font-sans text-[10px] text-accent uppercase tracking-[0.15em] mb-2">
              Key point
            </div>
            <p className="font-serif text-base text-textpri font-medium">
              {data.key_point}
            </p>
          </div>

          {data.forward_pointer && (
            <p className="font-serif text-sm text-textmuted italic mb-8 text-center">
              {data.forward_pointer}
            </p>
          )}
        </>
      ) : null}

      <button
        onClick={onContinue}
        className="w-full bg-accent hover:bg-accent-dim text-white font-sans py-3.5 rounded-lg transition-colors text-base"
      >
        {isLastSection ? "Continue to notes &rarr;" : `Continue to next section &rarr;`}
      </button>
      <button
        onClick={() => {
          const el = document.getElementById("main-scroll");
          if (el) el.scrollTo({ top: 0, behavior: "smooth" });
          else window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        className="mt-4 w-full font-sans text-sm text-textmuted hover:text-textpri transition-colors text-center"
      >
        Re-read this section
      </button>
    </div>
  );
}
