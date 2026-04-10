"use client";

import { useState, useEffect, useRef } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
}

export function SearchBar({ onSearch, isSearching }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      onSearch("");
      return;
    }

    debounceRef.current = setTimeout(() => {
      onSearch(query.trim());
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="w-full max-w-2xl relative">
      <div className="flex items-center border-b-2 border-bordercolor pb-3 focus-within:border-accent transition-colors">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search papers — e.g. transformer attention mechanism"
          className="bg-transparent border-none outline-none w-full font-serif text-lg text-textpri placeholder-textmuted/50"
        />
        {isSearching && (
          <span className="font-sans text-xs text-accent animate-pulse ml-3">
            searching...
          </span>
        )}
      </div>
    </div>
  );
}
