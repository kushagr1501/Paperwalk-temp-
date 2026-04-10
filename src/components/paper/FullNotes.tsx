"use client";

import { useEffect, useState } from "react";
import { usePaperStore } from "@/stores/paper";
import { streamLLMResponse } from "@/lib/anthropic";
import { buildFullNotesPrompt } from "@/lib/prompts/full-notes";
import { buildSystemPrompt } from "@/lib/prompts/system-prefix";

interface FullNotesProps {
  onContinue: () => void;
}

export function FullNotes({ onContinue }: FullNotesProps) {
  const store = usePaperStore();
  const [notes, setNotes] = useState(store.fullNotes || "");
  const [loading, setLoading] = useState(!store.fullNotes);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (store.fullNotes || !store.userContext || !store.metadata) return;

    let cancelled = false;

    streamLLMResponse(
      [
        {
          role: "user",
          content: buildFullNotesPrompt(
            store.metadata.title,
            store.sections,
            store.userContext,
            store.glossary
          ),
        },
      ],
      buildSystemPrompt(store.userContext),
      (chunk) => {
        if (!cancelled) setNotes((prev) => prev + chunk);
      },
      (fullText) => {
        if (!cancelled) {
          store.setFullNotes(fullText);
          setLoading(false);
        }
      }
    ).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopyNotion = () => {
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      const lines = doc.splitTextToSize(notes, 170);
      let y = 20;

      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);

      for (const line of lines) {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 20, y);
        y += 5;
      }

      const arxivId = store.metadata?.arxivId || "paper";
      const date = new Date().toISOString().split("T")[0];
      doc.save(`paperwalk-${arxivId}-${date}.pdf`);
    } catch {
      alert("PDF export failed. Try copying to Notion instead.");
    }
  };

  const renderMarkdown = (md: string) => {
    return md.split("\n").map((line, i) => {
      if (line.startsWith("# ")) {
        return <h1 key={i} className="font-serif text-2xl font-medium text-textpri mb-4 mt-10">{line.slice(2)}</h1>;
      }
      if (line.startsWith("## ")) {
        return <h2 key={i} className="font-serif text-xl font-medium text-textpri mb-3 mt-8">{line.slice(3)}</h2>;
      }
      if (line.startsWith("### ")) {
        return <h3 key={i} className="font-serif text-lg font-medium text-textpri mb-2 mt-6">{line.slice(4)}</h3>;
      }
      if (line.startsWith("- ")) {
        return <li key={i} className="font-serif text-sm text-textsec ml-4 mb-1">{line.slice(2)}</li>;
      }
      if (line.startsWith("```")) {
        return null;
      }
      if (line.match(/^\d+\./)) {
        return <li key={i} className="font-serif text-sm text-textsec ml-4 mb-1 list-decimal">{line.replace(/^\d+\.\s*/, "")}</li>;
      }
      if (line.trim() === "") {
        return <br key={i} />;
      }
      return <p key={i} className="font-serif text-sm text-textsec leading-relaxed mb-2">{line}</p>;
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-8 py-16">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-base border-b border-bordercolor pb-4 mb-10 flex items-center justify-between">
        <h2 className="font-serif text-2xl font-medium text-textpri">
          Reading Notes
        </h2>
        <div className="flex gap-3">
          <button
            onClick={handleCopyNotion}
            className="border border-bordercolor text-textmuted font-sans text-xs px-4 py-2 rounded-lg hover:border-accent-dim hover:text-textpri transition-colors"
          >
            {copied ? "Copied" : "Copy to Notion"}
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-accent text-white font-sans text-xs px-4 py-2 rounded-lg hover:bg-accent-dim transition-colors"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Notes content */}
      <div>
        {renderMarkdown(notes)}
        {loading && <span className="animate-pulse text-accent font-mono">&#9646;</span>}
      </div>

      {!loading && (
        <button
          onClick={onContinue}
          className="w-full mt-14 bg-accent text-white font-sans text-base py-4 rounded-lg hover:bg-accent-dim transition-colors"
        >
          Continue to coding challenge &rarr;
        </button>
      )}
    </div>
  );
}
