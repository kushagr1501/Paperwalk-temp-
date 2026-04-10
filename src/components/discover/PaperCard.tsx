"use client";

import Link from "next/link";
import type { SemanticPaper } from "@/lib/semanticscholar";

interface PaperCardProps {
  paper: SemanticPaper;
}

export function PaperCard({ paper }: PaperCardProps) {
  const arxivId = paper.externalIds?.ArXiv;
  const abstractSnippet = paper.abstract
    ? paper.abstract.slice(0, 200) + (paper.abstract.length > 200 ? "..." : "")
    : null;

  const authorsText =
    paper.authors.length > 3
      ? `${paper.authors[0].name} et al.`
      : paper.authors.map((a) => a.name).join(", ");

  return (
    <div className="bg-surface border border-bordercolor rounded-lg p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <h3 className="font-serif text-base font-medium text-textpri mb-2 leading-snug">
          {paper.title}
        </h3>
        <p className="font-sans text-xs text-textmuted mb-2">
          {authorsText}
          {paper.year ? ` · ${paper.year}` : ""}
          {paper.venue ? ` · ${paper.venue}` : ""}
        </p>
        {paper.citationCount > 0 && (
          <p className="font-sans text-xs text-textmuted mb-3">
            {paper.citationCount.toLocaleString()} citations
          </p>
        )}
        {abstractSnippet && (
          <p className="font-serif text-sm text-textmuted leading-relaxed mb-4">
            {abstractSnippet}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 mt-auto pt-2 border-t border-bordercolor">
        {arxivId ? (
          <Link
            href={`/paper/${arxivId}`}
            className="bg-accent text-white font-sans text-xs px-4 py-1.5 rounded-lg hover:bg-accent-dim transition-colors"
          >
            Walk this paper &rarr;
          </Link>
        ) : (
          <span className="font-sans text-xs text-textmuted">
            No arXiv link available
          </span>
        )}
        {arxivId && (
          <a
            href={`https://arxiv.org/abs/${arxivId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-xs text-accent-dim hover:text-accent transition-colors"
          >
            arXiv &nearr;
          </a>
        )}
      </div>
    </div>
  );
}
