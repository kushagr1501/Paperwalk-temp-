"use client";

import { useEffect, useState } from "react";
import { usePaperStore } from "@/stores/paper";
import { callLLMJSON } from "@/lib/anthropic";
import { buildHardEnglishDecoderPrompt } from "@/lib/prompts/hard-english-decoder";
import { ParagraphView } from "./ParagraphView";
import { InlineMathDecoder } from "./InlineMathDecoder";
import { InlineCodeLab } from "./InlineCodeLab";
import { SectionSummary } from "./SectionSummary";
import type { ParsedSection, TermMap } from "@/types/paper";

interface SectionViewProps {
  section: ParsedSection;
  prevSectionHeading?: string;
  nextSectionHeading?: string;
  isLastSection: boolean;
  onComplete: () => void;
}

export function SectionView({
  section,
  prevSectionHeading,
  nextSectionHeading,
  isLastSection,
  onComplete,
}: SectionViewProps) {
  const store = usePaperStore();
  const [termMap, setTermMap] = useState<TermMap>(
    store.termMaps[section.id] || {}
  );
  const [phraseMap, setPhraseMap] = useState<TermMap>(
    store.phraseMaps[section.id] || {}
  );
  const [decoderLoaded, setDecoderLoaded] = useState(
    !!store.termMaps[section.id]
  );

  useEffect(() => {
    if (decoderLoaded) return;

    async function loadDecoder() {
      try {
        const result = await callLLMJSON<{
          term_map: TermMap;
          phrase_map: TermMap;
        }>(
          [
            {
              role: "user",
              content: buildHardEnglishDecoderPrompt(section.body),
            },
          ],
          "You identify and define technical terms and academic phrases. Return only valid JSON."
        );
        setTermMap(result.term_map || {});
        setPhraseMap(result.phrase_map || {});
        store.setTermMap(section.id, result.term_map || {});
        store.setPhraseMap(section.id, result.phrase_map || {});
      } catch {
        // Continue without decoder
      } finally {
        setDecoderLoaded(true);
      }
    }

    loadDecoder();
  }, [section.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const bridgeSentence = prevSectionHeading
    ? `${prevSectionHeading} established the prior context. ${section.heading} builds on that foundation.`
    : null;

  const equationAfterParagraph: Record<number, typeof section.equations> = {};
  section.equations.forEach((eq, i) => {
    const paraIdx = Math.min(
      Math.floor(
        (i / Math.max(section.equations.length, 1)) * section.paragraphs.length
      ),
      section.paragraphs.length - 1
    );
    if (!equationAfterParagraph[paraIdx]) equationAfterParagraph[paraIdx] = [];
    equationAfterParagraph[paraIdx].push(eq);
  });

  const equationsList = section.equations
    .map((e) => `${e.label}: ${e.latex}`)
    .join("; ");

  return (
    <div className="max-w-2xl mx-auto px-8 py-16">
      {/* Section header */}
      <h2 className="font-serif text-3xl font-medium mb-3 text-textpri">
        {section.heading}
      </h2>

      {/* Bridge sentence */}
      {bridgeSentence && (
        <p className="font-serif text-[15px] text-textmuted italic mb-12 leading-relaxed">
          {bridgeSentence}
        </p>
      )}

      {/* Reading order hints */}
      {section.readingOrderHints.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10">
          {section.readingOrderHints.map((hint, i) => (
            <span
              key={i}
              className={`text-[10px] font-sans px-2.5 py-1 rounded ${
                hint.type === "dense-equations"
                  ? "bg-warning/10 border border-warning/20 text-warning"
                  : hint.type === "read-first"
                    ? "bg-accent-light border border-accent-dim/20 text-accent"
                    : "bg-elevated border border-bordercolor text-textmuted"
              }`}
            >
              {hint.text}
            </span>
          ))}
        </div>
      )}

      {/* Paragraphs + inline equations */}
      {section.paragraphs.map((para, idx) => (
        <div key={idx}>
          <ParagraphView
            paragraph={para}
            sectionId={section.id}
            paragraphIndex={idx}
            termMap={termMap}
            phraseMap={phraseMap}
          />

          {equationAfterParagraph[idx]?.map((eq) => (
            <InlineMathDecoder
              key={eq.id}
              equation={eq}
              sectionBody={section.body}
            />
          ))}
        </div>
      ))}

      {/* Code lab */}
      {section.hasAlgorithm && decoderLoaded && (
        <InlineCodeLab
          sectionId={section.id}
          sectionBody={section.body}
          equationsList={equationsList}
        />
      )}

      {/* Section complete card */}
      <SectionSummary
        sectionId={section.id}
        sectionHeading={section.heading}
        sectionBody={section.body}
        nextSectionHeading={nextSectionHeading}
        onContinue={onComplete}
        isLastSection={isLastSection}
      />
    </div>
  );
}
