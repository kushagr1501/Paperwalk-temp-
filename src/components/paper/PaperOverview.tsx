"use client";

import { usePaperStore } from "@/stores/paper";

interface PaperOverviewProps {
  onContinue: () => void;
}

export function PaperOverview({ onContinue }: PaperOverviewProps) {
  const { metadata, sections } = usePaperStore();
  if (!metadata) return null;

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="mb-10">
        <h2 className="font-serif text-2xl font-medium text-textpri mb-3 leading-snug">
          {metadata.title}
        </h2>
        <p className="font-sans text-sm text-textmuted mb-6">
          {metadata.authors.join(", ")} &middot; {metadata.venue}
        </p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="border border-bordercolor rounded-lg p-4 text-center">
            <div className="font-serif text-xl text-textpri font-medium">{metadata.sectionCount}</div>
            <div className="font-sans text-xs text-textmuted mt-1">sections</div>
          </div>
          <div className="border border-bordercolor rounded-lg p-4 text-center">
            <div className="font-serif text-xl text-textpri font-medium">{metadata.equationCount}</div>
            <div className="font-sans text-xs text-textmuted mt-1">equations</div>
          </div>
          <div className="border border-bordercolor rounded-lg p-4 text-center">
            <div className="font-serif text-xl text-textpri font-medium">
              {metadata.hasCode ? "yes" : "no"}
            </div>
            <div className="font-sans text-xs text-textmuted mt-1">code present</div>
          </div>
        </div>

        <div className="font-sans text-sm text-textmuted mb-6">
          Estimated walk-through: {metadata.estimatedTime}
        </div>

        <p className="font-serif text-[17px] text-textsec mb-6 leading-relaxed">
          {metadata.coreContribution}
        </p>

        <div className="flex gap-2 mb-8">
          {metadata.tags.map((tag) => (
            <span
              key={tag}
              className="bg-elevated text-textmuted text-xs px-2.5 py-0.5 rounded font-sans"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Reading order hints preview */}
        {sections.some((s) => s.readingOrderHints.length > 0) && (
          <div className="border-t border-bordercolor pt-6 mt-6">
            <div className="font-sans text-xs text-textmuted uppercase tracking-wider mb-4">
              Reading order hints
            </div>
            <div className="space-y-2">
              {sections.map((s) =>
                s.readingOrderHints.map((hint, i) => (
                  <div
                    key={`${s.id}-${i}`}
                    className="flex items-center gap-2 font-sans text-xs"
                  >
                    <span
                      className={`px-2 py-0.5 rounded ${
                        hint.type === "dense-equations"
                          ? "bg-warning/10 border border-warning/20 text-warning"
                          : hint.type === "read-first"
                            ? "bg-accent-light border border-accent-dim/20 text-accent"
                            : "bg-elevated border border-bordercolor text-textmuted"
                      }`}
                    >
                      {hint.text}
                    </span>
                    <span className="text-textmuted">{s.heading}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onContinue}
        className="w-full bg-accent text-white font-sans text-base py-4 rounded-lg hover:bg-accent-dim transition-colors"
      >
        Begin reading &rarr;
      </button>
    </div>
  );
}
