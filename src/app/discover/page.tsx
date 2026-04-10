"use client";

import { useState, useCallback } from "react";
import { SearchBar } from "@/components/discover/SearchBar";
import { TopicHubs } from "@/components/discover/TopicHubs";
import { PaperOfTheWeek } from "@/components/discover/PaperOfTheWeek";
import { PaperCard } from "@/components/discover/PaperCard";
import { searchPapers, type SemanticPaper } from "@/lib/semanticscholar";

export default function DiscoverPage() {
  const [results, setResults] = useState<SemanticPaper[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTopicQuery, setActiveTopicQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setError("");
    try {
      const papers = await searchPapers(query);
      setResults(papers);
      setHasSearched(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Search failed";
      setError(msg);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearch = useCallback(
    (query: string) => {
      setActiveTopicQuery("");
      doSearch(query);
    },
    [doSearch]
  );

  const handleTopicSelect = useCallback(
    (query: string) => {
      setActiveTopicQuery(query);
      if (query) {
        doSearch(query);
      } else {
        setResults([]);
        setHasSearched(false);
      }
    },
    [doSearch]
  );

  return (
    <div className="absolute inset-0 overflow-y-auto w-full flex flex-col items-center pt-12 px-4 pb-20">
      <SearchBar onSearch={handleSearch} isSearching={isSearching} />

      <div className="mt-6 mb-8 w-full flex justify-center">
        <TopicHubs activeQuery={activeTopicQuery} onSelect={handleTopicSelect} />
      </div>

      {!hasSearched && !isSearching && !error && (
        <div className="mb-8 w-full flex justify-center">
          <PaperOfTheWeek />
        </div>
      )}

      {error && (
        <div className="w-full max-w-2xl mb-6 border border-error/30 rounded-lg px-4 py-3 font-sans text-sm text-error bg-error/5">
          {error}
        </div>
      )}

      {hasSearched && results.length === 0 && !isSearching && (
        <p className="font-serif text-sm text-textmuted mt-8 italic">
          No results found.
        </p>
      )}

      {results.length > 0 && (
        <div className="w-full max-w-2xl">
          <p className="font-sans text-xs text-textmuted mb-4">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {results.map((paper) => (
              <PaperCard key={paper.paperId} paper={paper} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
