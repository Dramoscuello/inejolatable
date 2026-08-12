"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { ChevronUp, ChevronDown, X, Search } from "lucide-react";
import { useBaseStore } from "@/store/useBaseStore";

export function SearchBar() {
  const {
    searchTerm, setSearchTerm,
    searchMatches, setSearchMatches,
    searchActiveIndex, setSearchActiveIndex,
    setSearchOpen,
  } = useBaseStore();

  const [localTerm, setLocalTerm] = useState(searchTerm);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const onChange = useCallback(
    (value: string) => {
      setLocalTerm(value);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setSearchTerm(value);
      }, 150);
    },
    [setSearchTerm],
  );

  const onPrev = useCallback(() => {
    setSearchActiveIndex(
      searchMatches.length > 0
        ? (searchActiveIndex - 1 + searchMatches.length) % searchMatches.length
        : 0
    );
  }, [searchMatches, searchActiveIndex, setSearchActiveIndex]);

  const onNext = useCallback(() => {
    setSearchActiveIndex(
      searchMatches.length > 0
        ? (searchActiveIndex + 1) % searchMatches.length
        : 0
    );
  }, [searchMatches, searchActiveIndex, setSearchActiveIndex]);

  const onClose = useCallback(() => {
    setSearchTerm("");
    setLocalTerm("");
    setSearchOpen(false);
  }, [setSearchTerm, setSearchOpen]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.shiftKey ? onPrev() : onNext();
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [onPrev, onNext, onClose],
  );

  return (
    <div className="flex items-center gap-1.5 bg-white border border-brand-border rounded-lg px-2 py-1 shadow-sm">
      <Search size={14} className="text-brand-muted shrink-0" />
      <input
        ref={inputRef}
        value={localTerm}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Buscar en la vista..."
        className="flex-1 min-w-0 text-sm text-brand-ink outline-none bg-transparent placeholder:text-brand-border-strong"
      />
      <span className="text-xs text-brand-muted tabular-nums shrink-0 min-w-[40px] text-center">
        {searchTerm
          ? searchMatches.length > 0
            ? `${searchActiveIndex + 1} de ${searchMatches.length}`
            : "Sin resultados"
          : ""}
      </span>
      <button
        onClick={onPrev}
        className="p-0.5 rounded text-brand-muted hover:text-brand-ink transition-colors cursor-pointer disabled:opacity-30"
        disabled={searchMatches.length === 0}
      >
        <ChevronUp size={14} />
      </button>
      <button
        onClick={onNext}
        className="p-0.5 rounded text-brand-muted hover:text-brand-ink transition-colors cursor-pointer disabled:opacity-30"
        disabled={searchMatches.length === 0}
      >
        <ChevronDown size={14} />
      </button>
      <button
        onClick={onClose}
        className="p-0.5 rounded text-brand-muted hover:text-brand-ink transition-colors cursor-pointer"
      >
        <X size={14} />
      </button>
    </div>
  );
}
