"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ApiKeyModal } from "@/components/onboarding/ApiKeyModal";

function extractArxivId(input: string): string | null {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5}(?:v\d+)?)/);
  if (urlMatch) return urlMatch[1].replace(/v\d+$/, "");
  const idMatch = trimmed.match(/^(\d{4}\.\d{4,5})(?:v\d+)?$/);
  if (idMatch) return idMatch[1];
  return null;
}

export default function LandingPage() {
  const [input, setInput] = useState("");
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const key = localStorage.getItem("paperwalk_api_key");
    setHasKey(!!key);
    if (!key) setShowApiKeyModal(true);
  }, []);

  const handleWalk = () => {
    if (!hasKey) {
      setShowApiKeyModal(true);
      return;
    }
    const id = extractArxivId(input);
    if (id) {
      router.push(`/paper/${id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleWalk();
  };

  return (
    <div className="absolute inset-0 overflow-y-auto w-full flex flex-col items-center pt-24 px-4">
      {/* Hero */}
      <h1 className="font-serif text-4xl md:text-[44px] text-center mb-3 font-medium text-textpri leading-tight">
        Read research papers<br />like you wrote them.
      </h1>
      <p className="font-serif text-lg text-textmuted text-center mb-16 italic">
        Word by word. Equation by equation. Line by line.
      </p>

      {/* Search Box */}
      <div className="w-full max-w-xl relative">
        <div className="flex items-center border-b-2 border-bordercolor pb-3 focus-within:border-accent transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste an arXiv URL or ID..."
            className="bg-transparent border-none outline-none w-full font-serif text-lg text-textpri placeholder-textmuted/60"
          />
          <button
            onClick={handleWalk}
            className="font-sans text-sm text-accent whitespace-nowrap ml-4 hover:text-accent-dim transition-colors font-medium"
          >
            Walk this paper &rarr;
          </button>
        </div>
        <button
          onClick={() => router.push("/paper/upload")}
          className="mt-6 w-full border border-dashed border-bordercolor rounded-lg p-5 text-center text-textmuted font-sans text-sm hover:border-accent-dim hover:text-textsec transition-colors cursor-pointer"
        >
          ...or drop a PDF here.
        </button>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-2xl mt-20 mb-8">
        <div className="text-center">
          <div className="font-serif text-3xl text-warning mb-3 italic">&#8721;</div>
          <h3 className="font-serif text-base font-medium text-textpri mb-1.5">
            Every equation decoded
          </h3>
          <p className="font-serif text-sm text-textmuted leading-relaxed">
            Symbol by symbol. Worked example with real numbers. Interactive plot.
          </p>
        </div>
        <div className="text-center">
          <div className="font-mono text-2xl text-accent mb-3">&lt;/&gt;</div>
          <h3 className="font-serif text-base font-medium text-textpri mb-1.5">
            Code in your language
          </h3>
          <p className="font-serif text-sm text-textmuted leading-relaxed">
            Every algorithm implemented in your language. Run in-browser.
          </p>
        </div>
        <div className="text-center">
          <div className="font-serif text-3xl text-textmuted mb-3 italic">&sect;</div>
          <h3 className="font-serif text-base font-medium text-textpri mb-1.5">
            Paragraph by paragraph
          </h3>
          <p className="font-serif text-sm text-textmuted leading-relaxed">
            Every sentence explained. Every jargon term decoded inline.
          </p>
        </div>
      </div>

      {/* Three Steps */}
      <div className="w-full max-w-2xl mb-20 mt-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 font-sans text-sm text-textmuted">
          <div className="flex items-center gap-2">
            <span className="text-accent font-medium">1.</span>
            <span>Paste arXiv link</span>
          </div>
          <span className="hidden md:block text-bordercolor">&mdash;</span>
          <div className="flex items-center gap-2">
            <span className="text-accent font-medium">2.</span>
            <span>Walk through word by word</span>
          </div>
          <span className="hidden md:block text-bordercolor">&mdash;</span>
          <div className="flex items-center gap-2">
            <span className="text-accent font-medium">3.</span>
            <span>Read the original paper alone</span>
          </div>
        </div>
      </div>

      {showApiKeyModal && (
        <ApiKeyModal
          onClose={() => {
            setShowApiKeyModal(false);
            setHasKey(!!localStorage.getItem("paperwalk_api_key"));
          }}
          required={!hasKey}
        />
      )}
    </div>
  );
}
