"use client";

import { useState } from "react";
import { usePaperStore } from "@/stores/paper";
import { SidebarNav } from "./SidebarNav";
import { SectionView } from "./SectionView";
import { FullNotes } from "./FullNotes";
import { CodingChallenge } from "./CodingChallenge";
import { SelfTestQuiz } from "./SelfTestQuiz";
import { GlossaryPanel } from "@/components/ui/GlossaryPanel";

export function SectionWalkthroughShell() {
  const store = usePaperStore();
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  const sections = store.sections;
  const currentIdx = store.currentSectionIndex;
  const currentSection = sections[currentIdx];

  const handleSectionComplete = () => {
    if (currentSection) {
      store.completeSection(currentSection.id);
    }

    if (currentIdx < sections.length - 1) {
      store.setCurrentSectionIndex(currentIdx + 1);
      const mainEl = document.getElementById("main-scroll");
      if (mainEl) mainEl.scrollTop = 0;
    } else {
      store.setCurrentStage(6);
    }
  };

  const renderMainContent = () => {
    if (store.currentStage === 6) {
      return <FullNotes onContinue={() => store.setCurrentStage(7)} />;
    }

    if (store.currentStage === 7) {
      return <CodingChallenge onContinue={() => store.setCurrentStage(8)} />;
    }

    if (store.currentStage === 8) {
      return <SelfTestQuiz />;
    }

    if (!currentSection) return null;

    return (
      <SectionView
        section={currentSection}
        prevSectionHeading={
          currentIdx > 0 ? sections[currentIdx - 1].heading : undefined
        }
        nextSectionHeading={
          currentIdx < sections.length - 1
            ? sections[currentIdx + 1].heading
            : undefined
        }
        isLastSection={currentIdx === sections.length - 1}
        onComplete={handleSectionComplete}
      />
    );
  };

  return (
    <>
      <SidebarNav onGlossaryToggle={() => setGlossaryOpen((p) => !p)} />

      <div
        className="flex-1 overflow-y-auto bg-base relative"
        id="main-scroll"
      >
        {renderMainContent()}
      </div>

      <GlossaryPanel
        isOpen={glossaryOpen}
        onClose={() => setGlossaryOpen(false)}
      />
    </>
  );
}
