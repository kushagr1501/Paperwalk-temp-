"use client";

import { usePaperStore } from "@/stores/paper";

interface SidebarNavProps {
  onGlossaryToggle: () => void;
}

export function SidebarNav({ onGlossaryToggle }: SidebarNavProps) {
  const {
    sections,
    currentSectionIndex,
    completedSections,
    currentStage,
    glossary,
  } = usePaperStore();

  return (
    <aside className="w-60 border-r border-bordercolor bg-surface hidden md:flex flex-col flex-shrink-0 overflow-y-auto py-6 px-5">
      <div className="font-sans text-[10px] text-textmuted mb-6 uppercase tracking-[0.15em]">
        Progress
      </div>

      {/* Abstract */}
      <div className="flex items-center space-x-3 font-sans text-sm mb-5">
        {currentStage > 4 ? (
          <>
            <span className="text-success text-xs">&#10003;</span>
            <span className="text-textmuted line-through">Abstract</span>
          </>
        ) : (
          <>
            <span className="text-bordercolor text-xs">&bull;</span>
            <span className="text-textmuted">Abstract</span>
          </>
        )}
      </div>

      {/* Sections */}
      {sections.map((section, idx) => {
        const isCompleted = completedSections.includes(section.id);
        const isCurrent = currentStage >= 5 && idx === currentSectionIndex;
        const hasEquationBadge = section.readingOrderHints.some(
          (h) => h.type === "dense-equations"
        );
        const readFirstHint = section.readingOrderHints.find(
          (h) => h.type === "read-first"
        );

        return (
          <div key={section.id} className="flex flex-col mb-4">
            <div
              className={`flex items-center space-x-3 font-serif text-sm ${
                isCompleted
                  ? "text-success"
                  : isCurrent
                    ? "text-accent"
                    : "text-textmuted"
              }`}
            >
              {isCompleted ? (
                <span className="text-xs">&#10003;</span>
              ) : isCurrent ? (
                <span className="text-accent text-xs">&rsaquo;</span>
              ) : (
                <span className="text-bordercolor text-xs">&bull;</span>
              )}
              <span
                className={
                  isCompleted
                    ? "line-through text-textmuted"
                    : isCurrent
                      ? "text-textpri font-medium"
                      : ""
                }
              >
                {section.heading}
              </span>
            </div>

            {/* Badges */}
            <div className="ml-6 mt-1 space-y-1">
              {hasEquationBadge && (
                <div className="flex items-center space-x-1 bg-warning/10 border border-warning/20 text-warning text-[10px] px-2 py-0.5 rounded w-fit font-sans">
                  <span>Dense equations</span>
                </div>
              )}
              {readFirstHint && (
                <div className="flex items-center space-x-1 bg-accent-light border border-accent-dim/20 text-accent text-[10px] px-2 py-0.5 rounded w-fit font-sans">
                  <span>{readFirstHint.text}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Bottom links */}
      <div className="mt-auto pt-6 border-t border-bordercolor font-sans text-sm text-textmuted space-y-3">
        <div className="hover:text-textpri cursor-pointer transition-colors">
          Notes
        </div>
        <div className="hover:text-textpri cursor-pointer transition-colors">
          Challenge
        </div>
        <div className="hover:text-textpri cursor-pointer transition-colors">
          Quiz
        </div>
        <button
          onClick={onGlossaryToggle}
          className="hover:text-textpri transition-colors text-left"
        >
          Glossary ({Object.keys(glossary).length})
        </button>
      </div>
    </aside>
  );
}
