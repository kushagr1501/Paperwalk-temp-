"use client";

import { useState, useEffect } from "react";
import { usePaperStore } from "@/stores/paper";
import { callLLMJSON } from "@/lib/anthropic";
import { buildPrerequisitesPrompt } from "@/lib/prompts/prerequisites";
import { buildQuickRevisionPrompt } from "@/lib/prompts/quick-revision";
import { buildSystemPrompt } from "@/lib/prompts/system-prefix";
import { QuickRevision } from "./QuickRevision";
import type { Prerequisites, PrerequisiteItem } from "@/types/paper";

interface PrerequisiteCheckProps {
  onComplete: () => void;
}

type Category = "maths" | "systems" | "coding";

export function PrerequisiteCheck({ onComplete }: PrerequisiteCheckProps) {
  const store = usePaperStore();
  const [loading, setLoading] = useState(true);
  const [prereqs, setPrereqs] = useState<Prerequisites | null>(null);
  const [loadingRevision, setLoadingRevision] = useState<string | null>(null);

  useEffect(() => {
    if (store.prerequisites) {
      setPrereqs(store.prerequisites);
      setLoading(false);
      return;
    }

    async function loadPrereqs() {
      try {
        const paperText = store.sections
          .map((s) => `${s.heading}\n\n${s.body}`)
          .join("\n\n");

        const result = await callLLMJSON<{
          prerequisites: {
            maths: string[];
            systems: string[];
            coding: string[];
          };
        }>(
          [{ role: "user", content: buildPrerequisitesPrompt(paperText) }],
          "You analyse research papers and extract prerequisite knowledge. Return only valid JSON."
        );

        const buildItems = (concepts: string[]): PrerequisiteItem[] =>
          concepts.map((c) => ({ concept: c, status: "unset" as const }));

        const p: Prerequisites = {
          maths: buildItems(result.prerequisites.maths || []),
          systems: buildItems(result.prerequisites.systems || []),
          coding: buildItems(result.prerequisites.coding || []),
        };

        setPrereqs(p);
        store.setPrerequisites(p);
      } catch {
        const empty: Prerequisites = { maths: [], systems: [], coding: [] };
        setPrereqs(empty);
        store.setPrerequisites(empty);
      } finally {
        setLoading(false);
      }
    }

    loadPrereqs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateItemStatus = (
    category: Category,
    index: number,
    status: PrerequisiteItem["status"]
  ) => {
    if (!prereqs) return;
    const updated = { ...prereqs };
    const items = [...updated[category]];
    items[index] = { ...items[index], status };
    updated[category] = items;
    setPrereqs(updated);
    store.setPrerequisites(updated);

    if (status === "learn-in-context") {
      store.addLearnInContextFlag(items[index].concept);
    }
  };

  const handleQuickRevision = async (
    category: Category,
    index: number
  ) => {
    if (!prereqs || !store.userContext) return;
    const item = prereqs[category][index];

    if (item.revisionContent) {
      updateItemStatus(category, index, "quick-revision");
      return;
    }

    setLoadingRevision(`${category}-${index}`);
    updateItemStatus(category, index, "quick-revision");

    try {
      const result = await callLLMJSON<{
        explanation: string;
        analogy: string;
        worked_example: string;
        self_check_question: string;
      }>(
        [
          {
            role: "user",
            content: buildQuickRevisionPrompt(
              item.concept,
              category,
              store.userContext
            ),
          },
        ],
        buildSystemPrompt(store.userContext)
      );

      const updated = { ...prereqs };
      const items = [...updated[category]];
      items[index] = {
        ...items[index],
        status: "quick-revision",
        revisionContent: {
          explanation: result.explanation,
          analogy: result.analogy,
          workedExample: result.worked_example,
          selfCheckQuestion: result.self_check_question,
        },
      };
      updated[category] = items;
      setPrereqs(updated);
      store.setPrerequisites(updated);
    } catch {
      // Keep status but no content
    } finally {
      setLoadingRevision(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center pt-16 px-4">
        <div className="font-serif text-base text-textmuted italic animate-pulse">
          Analysing paper prerequisites...
        </div>
      </div>
    );
  }

  if (!prereqs) return null;

  const renderColumn = (
    title: string,
    category: Category,
    items: PrerequisiteItem[]
  ) => (
    <div>
      <h3 className="font-sans text-xs text-textmuted mb-4 uppercase tracking-[0.15em] border-b border-bordercolor pb-2">
        {title}
      </h3>
      {items.length === 0 && (
        <p className="font-serif text-sm text-textmuted italic">
          No prerequisites identified.
        </p>
      )}
      {items.map((item, idx) => {
        const isExpanded = item.status === "quick-revision";
        const isLoadingThis = loadingRevision === `${category}-${idx}`;

        return (
          <div
            key={item.concept}
            className={`mb-5 ${
              isExpanded
                ? "bg-accent-light/50 border border-accent-dim/20 rounded-lg p-3 -mx-3"
                : ""
            }`}
          >
            <div className="font-serif text-textsec mb-2">{item.concept}</div>
            <div className="flex space-x-2">
              <button
                onClick={() => updateItemStatus(category, idx, "know-it")}
                className={`text-[11px] font-sans px-2.5 py-1 rounded-lg transition-colors ${
                  item.status === "know-it"
                    ? "bg-success/15 text-success border border-success/25"
                    : "bg-surface border border-bordercolor text-textmuted hover:text-textpri"
                }`}
              >
                know it
              </button>
              <button
                onClick={() => handleQuickRevision(category, idx)}
                className={`text-[11px] font-sans px-2.5 py-1 rounded-lg transition-colors ${
                  item.status === "quick-revision"
                    ? "bg-accent-light text-accent border border-accent-dim/30"
                    : "bg-surface border border-bordercolor text-textmuted hover:text-textpri"
                }`}
              >
                {isLoadingThis ? "loading..." : "quick revision"}
              </button>
              <button
                onClick={() =>
                  updateItemStatus(category, idx, "learn-in-context")
                }
                className={`text-[11px] font-sans px-2.5 py-1 rounded-lg transition-colors ${
                  item.status === "learn-in-context"
                    ? "bg-elevated border border-bordercolor text-textpri"
                    : "bg-surface border border-bordercolor text-textmuted hover:text-textpri"
                }`}
              >
                learn in context
              </button>
            </div>

            {isExpanded && item.revisionContent && (
              <QuickRevision item={item} />
            )}
            {isExpanded && isLoadingThis && (
              <div className="mt-3 font-serif text-sm text-textmuted italic animate-pulse">
                Generating revision content...
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="w-full flex flex-col items-center pt-10 px-4">
      <h2 className="font-serif text-2xl font-medium mb-2 text-center max-w-xl text-textpri">
        This paper assumes the following background.
      </h2>
      <p className="font-serif text-textmuted italic mb-12">
        Mark what applies to you.
      </p>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
        {renderColumn("Maths", "maths", prereqs.maths)}
        {renderColumn("Systems", "systems", prereqs.systems)}
        {renderColumn("Coding", "coding", prereqs.coding)}
      </div>

      <div className="mt-14 mb-20">
        <button
          onClick={onComplete}
          className="bg-accent text-white font-sans text-base px-12 py-4 rounded-lg hover:bg-accent-dim transition-colors"
        >
          Begin Paper Walkthrough &rarr;
        </button>
      </div>
    </div>
  );
}
