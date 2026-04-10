"use client";

import { usePaperStore } from "@/stores/paper";

interface GlossaryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlossaryPanel({ isOpen, onClose }: GlossaryPanelProps) {
  const glossary = usePaperStore((s) => s.glossary);
  const entries = Object.values(glossary).sort((a, b) =>
    a.term.localeCompare(b.term)
  );

  return (
    <aside
      className={`absolute right-0 top-0 bottom-0 w-80 bg-surface border-l border-bordercolor shadow-lg z-30 flex flex-col transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="p-5 border-b border-bordercolor flex justify-between items-center">
        <h2 className="font-serif text-base font-medium text-textpri">
          Glossary{" "}
          <span className="text-textmuted font-normal">({entries.length})</span>
        </h2>
        <button
          onClick={onClose}
          className="text-textmuted hover:text-textpri transition-colors font-sans text-sm"
        >
          &times;
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {entries.length === 0 && (
          <p className="font-serif text-sm text-textmuted italic">
            Hover or click on highlighted terms to add them here.
          </p>
        )}
        {entries.map((entry) => (
          <div
            key={entry.term}
            className="mb-6 border-b border-bordercolor pb-4 last:border-0"
          >
            <div className="font-serif text-accent font-medium mb-1.5">
              {entry.term}
            </div>
            <p className="font-serif text-sm text-textsec mb-2 leading-relaxed">
              {entry.definition}
            </p>
            <p className="font-sans text-xs text-textmuted bg-elevated px-2 py-1 rounded w-fit">
              First seen in: {entry.firstSeenSection}
            </p>
          </div>
        ))}
      </div>
    </aside>
  );
}
