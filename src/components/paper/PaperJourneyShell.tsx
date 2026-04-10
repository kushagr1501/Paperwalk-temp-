"use client";

import { useEffect, useState, useCallback } from "react";
import { usePaperStore } from "@/stores/paper";
import { fetchArxivMetadata, fetchArxivPDF } from "@/lib/arxiv";
import { extractTextFromPDF } from "@/lib/pdf-parser";
import { callLLMJSON } from "@/lib/anthropic";
import { getPdf } from "@/lib/idb";
import {
  STRUCTURE_EXTRACT_PROMPT,
  buildStructureExtractionMessage,
} from "@/lib/prompts/structure-extract";
import { buildOverviewPrompt } from "@/lib/prompts/paper-overview";
import { UserContextIntake } from "@/components/onboarding/UserContextIntake";
import { ApiKeyModal } from "@/components/onboarding/ApiKeyModal";
import { PrerequisiteCheck } from "@/components/prerequisites/PrerequisiteCheck";
import { PaperOverview } from "@/components/paper/PaperOverview";
import { AbstractView } from "@/components/paper/AbstractView";
import { SectionWalkthroughShell } from "@/components/paper/SectionWalkthroughShell";
import type { UserContext, ParsedSection, ReadingOrderHint } from "@/types/paper";

interface Props {
  arxivId: string;
}

type IngestionStep =
  | "check-key"
  | "fetching-metadata"
  | "fetching-pdf"
  | "extracting-text"
  | "structuring"
  | "generating-overview"
  | "done"
  | "error";

export function PaperJourneyShell({ arxivId }: Props) {
  const store = usePaperStore();
  const [ingestionStep, setIngestionStep] = useState<IngestionStep>("check-key");
  const [errorMsg, setErrorMsg] = useState("");
  const [needsApiKey, setNeedsApiKey] = useState(false);

  const isUpload = arxivId.startsWith("upload-");

  const ingestPaper = useCallback(async () => {
    try {
      let meta: { title: string; authors: string[]; abstract: string; year: string; venue: string; arxivId: string };
      let text: string;

      if (isUpload) {
        setIngestionStep("fetching-pdf");
        const dataUrl = await getPdf(`paperwalk_upload_${arxivId}`);
        if (!dataUrl) {
          throw new Error("Uploaded PDF not found. Please re-upload the file.");
        }
        const res = await fetch(dataUrl);
        const pdfBuffer = await res.arrayBuffer();

        setIngestionStep("extracting-text");
        text = await extractTextFromPDF(pdfBuffer);

        const firstLine = text.split("\n").find((l) => l.trim().length > 10)?.trim() || "Uploaded Paper";
        meta = {
          title: firstLine.slice(0, 200),
          authors: ["Unknown"],
          abstract: text.slice(0, 1000),
          year: new Date().getFullYear().toString(),
          venue: "Uploaded PDF",
          arxivId,
        };
      } else {
        setIngestionStep("fetching-metadata");
        meta = await fetchArxivMetadata(arxivId);

        setIngestionStep("fetching-pdf");
        const pdfBuffer = await fetchArxivPDF(arxivId);

        setIngestionStep("extracting-text");
        text = await extractTextFromPDF(pdfBuffer);
      }

      store.setPaperId(arxivId);
      store.setRawAbstract(meta.abstract);

      setIngestionStep("structuring");
      const structureResult = await callLLMJSON<{
        title?: string;
        authors?: string[];
        abstract?: string;
        sections: Array<{
          id: string;
          heading: string;
          body: string;
          equations: Array<{ id: string; latex: string; label: string }>;
          has_algorithm: boolean;
        }>;
        reading_order_hints?: Array<{
          section_id: string;
          type: string;
          text: string;
          reason: string;
        }>;
      }>(
        [{ role: "user", content: buildStructureExtractionMessage(text) }],
        STRUCTURE_EXTRACT_PROMPT
      );

      const hints = structureResult.reading_order_hints || [];
      const sections: ParsedSection[] = structureResult.sections.map((s) => ({
        id: s.id,
        heading: s.heading,
        body: s.body,
        paragraphs: s.body
          .split(/\n\n+/)
          .map((p) => p.trim())
          .filter((p) => p.length > 30),
        equations: s.equations || [],
        hasAlgorithm: s.has_algorithm || false,
        readingOrderHints: hints
          .filter((h) => h.section_id === s.id)
          .map(
            (h) =>
              ({
                sectionId: h.section_id,
                type: h.type as ReadingOrderHint["type"],
                text: h.text,
              }) satisfies ReadingOrderHint
          ),
      }));

      store.setSections(sections);

      setIngestionStep("generating-overview");
      const overview = await callLLMJSON<{
        core_contribution: string;
        tags: string[];
      }>(
        [{ role: "user", content: buildOverviewPrompt(meta.title, meta.abstract) }],
        "You generate factual paper overviews. Return only valid JSON."
      );

      const totalEquations = sections.reduce((acc, s) => acc + s.equations.length, 0);
      const estimatedMinutes = sections.length * 4 + totalEquations * 3;
      const hours = Math.floor(estimatedMinutes / 60);
      const mins = estimatedMinutes % 60;
      const estimatedTime = hours > 0 ? `~${hours}h ${mins}m` : `~${mins} minutes`;

      store.setMetadata({
        title: meta.title,
        authors: meta.authors,
        year: meta.year,
        venue: meta.venue,
        abstract: meta.abstract,
        arxivId: meta.arxivId,
        sectionCount: sections.length,
        equationCount: totalEquations,
        hasCode: sections.some((s) => s.hasAlgorithm),
        coreContribution: overview.core_contribution,
        tags: overview.tags,
        estimatedTime,
      });

      setIngestionStep("done");
      store.setCurrentStage(1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error during ingestion";
      setErrorMsg(msg);
      setIngestionStep("error");
    }
  }, [arxivId, store, isUpload]);

  useEffect(() => {
    const key = localStorage.getItem("paperwalk_api_key");
    if (!key) {
      setNeedsApiKey(true);
      return;
    }

    if (store.paperId === arxivId && store.metadata) {
      setIngestionStep("done");
      if (store.currentStage === 0) {
        store.setCurrentStage(1);
      }
      return;
    }

    const savedCtx = localStorage.getItem("paperwalk_user_context");
    if (savedCtx) {
      try {
        store.setUserContext(JSON.parse(savedCtx));
      } catch { /* ignore */ }
    }

    ingestPaper();
  }, [arxivId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApiKeySaved = () => {
    setNeedsApiKey(false);
    ingestPaper();
  };

  const handleContextComplete = (ctx: UserContext) => {
    store.setUserContext(ctx);
    store.setCurrentStage(2);
  };

  // API key modal
  if (needsApiKey) {
    return <ApiKeyModal onClose={handleApiKeySaved} required={true} />;
  }

  // Ingestion progress
  if (ingestionStep !== "done" && ingestionStep !== "error") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="font-serif text-base text-textmuted italic mb-8 text-center">
            Loading paper...
          </div>
          <div className="space-y-3">
            {[
              { key: "fetching-metadata", label: "Fetching arXiv metadata" },
              { key: "fetching-pdf", label: "Downloading PDF" },
              { key: "extracting-text", label: "Extracting text from PDF" },
              { key: "structuring", label: "Analysing paper structure" },
              { key: "generating-overview", label: "Generating overview" },
            ].map((step) => {
              const stepOrder = [
                "check-key", "fetching-metadata", "fetching-pdf",
                "extracting-text", "structuring", "generating-overview",
              ];
              const isCurrent = ingestionStep === step.key;
              const isDone = stepOrder.indexOf(ingestionStep) > stepOrder.indexOf(step.key);
              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-3 font-sans text-sm ${
                    isDone ? "text-success" : isCurrent ? "text-textpri" : "text-textmuted"
                  }`}
                >
                  <span className="w-5 text-center">
                    {isDone ? "\u2713" : isCurrent ? "\u203A" : "\u00B7"}
                  </span>
                  <span>{step.label}</span>
                  {isCurrent && <span className="animate-pulse text-accent">...</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (ingestionStep === "error") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md border border-error/30 rounded-lg p-6 bg-error/5">
          <h3 className="font-sans text-sm text-error mb-3 uppercase tracking-wider">
            Error loading paper
          </h3>
          <p className="font-serif text-sm text-textpri mb-4">{errorMsg}</p>
          <button
            onClick={() => { setErrorMsg(""); ingestPaper(); }}
            className="bg-accent text-white font-sans text-sm px-6 py-2 rounded-lg hover:bg-accent-dim transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Stage 1: User context intake
  if (store.currentStage === 1) {
    return (
      <div className="absolute inset-0 overflow-y-auto w-full flex flex-col items-center pt-16 px-4">
        <UserContextIntake onComplete={handleContextComplete} />
      </div>
    );
  }

  // Stage 2: Prerequisites
  if (store.currentStage === 2) {
    return (
      <div className="absolute inset-0 overflow-y-auto w-full">
        <PrerequisiteCheck onComplete={() => store.setCurrentStage(3)} />
      </div>
    );
  }

  // Stage 3: Paper Overview
  if (store.currentStage === 3) {
    return (
      <div className="absolute inset-0 overflow-y-auto w-full flex flex-col items-center pt-12 px-4">
        <PaperOverview onContinue={() => store.setCurrentStage(4)} />
      </div>
    );
  }

  // Stage 4: Abstract
  if (store.currentStage === 4) {
    return (
      <div className="absolute inset-0 overflow-y-auto w-full">
        <AbstractView onContinue={() => store.setCurrentStage(5)} />
      </div>
    );
  }

  // Stage 5+: Section walkthrough (and beyond)
  if (store.currentStage >= 5) {
    return (
      <div className="absolute inset-0 w-full flex">
        <SectionWalkthroughShell />
      </div>
    );
  }

  return null;
}
