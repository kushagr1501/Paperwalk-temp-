"use client";

import Link from "next/link";
import { paperOfTheWeek } from "@/data/paper-of-the-week";

export function PaperOfTheWeek() {
  return (
    <div className="w-full max-w-2xl bg-surface border border-bordercolor rounded-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center">
      <div>
        <div className="font-sans text-xs text-accent mb-2 uppercase tracking-wider font-medium">
          Paper of the Week
        </div>
        <h3 className="font-serif text-lg font-medium mb-1 text-textpri">
          {paperOfTheWeek.title}
        </h3>
        <p className="font-sans text-xs text-textmuted mb-2">
          {paperOfTheWeek.authors.join(", ")} &middot; {paperOfTheWeek.venue} &middot;{" "}
          {paperOfTheWeek.citations.toLocaleString()} citations
        </p>
        <p className="font-serif text-sm text-textmuted mb-4 max-w-lg leading-relaxed">
          {paperOfTheWeek.hook}
        </p>
        <div className="flex space-x-2">
          {paperOfTheWeek.tags.map((tag) => (
            <span
              key={tag}
              className="bg-elevated text-textmuted text-xs px-2 py-0.5 rounded font-sans"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <Link
        href={`/paper/${paperOfTheWeek.arxivId}`}
        className="mt-4 md:mt-0 bg-accent text-white font-sans text-sm px-6 py-2 rounded-lg hover:bg-accent-dim transition-colors whitespace-nowrap flex-shrink-0"
      >
        Walk this paper &rarr;
      </Link>
    </div>
  );
}
