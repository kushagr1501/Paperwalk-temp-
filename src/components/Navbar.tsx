"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ApiKeyModal } from "./onboarding/ApiKeyModal";

export function Navbar() {
  const [showSettings, setShowSettings] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);

  useEffect(() => {
    (window as unknown as Record<string, unknown>).__toggleGlossary = () =>
      setShowGlossary((p) => !p);
    (window as unknown as Record<string, unknown>).__glossaryOpen = showGlossary;
  }, [showGlossary]);

  return (
    <>
      <nav className="flex items-center justify-between px-8 py-4 border-b border-bordercolor bg-base z-20 flex-shrink-0">
        <Link
          href="/"
          className="font-serif text-lg tracking-wide text-textpri hover:text-accent transition-colors"
        >
          <span className="font-medium italic">PaperWalk</span>
        </Link>
        <div className="font-sans text-[13px] text-textmuted flex space-x-8 items-center">
          <Link
            href="/discover"
            className="hover:text-textpri transition-colors"
          >
            Discover
          </Link>
          <button className="hover:text-textpri transition-colors">
            My papers
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="hover:text-textpri transition-colors"
          >
            Settings
          </button>
        </div>
      </nav>

      {showSettings && <ApiKeyModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
