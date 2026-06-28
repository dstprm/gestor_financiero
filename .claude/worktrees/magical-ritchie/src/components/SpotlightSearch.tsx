'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { spotlightRef } from '@/components/chart/OrgChart';

interface SearchResult {
  id: string;
  name: string;
  title: string;
  department: string;
  managerId: string | null;
  managerName: string | null;
}

interface SpotlightSearchProps {
  open: boolean;
  onClose: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0][0] ?? '?').toUpperCase();
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase();
}

export function SpotlightSearch({ open, onClose }: SpotlightSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset and focus when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const doSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data: SearchResult[] = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 150);
  }, []);

  useEffect(() => {
    doSearch(query);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      onClose();
      // Small delay so modal closes before pan animation starts
      setTimeout(() => spotlightRef.fn?.(result.id), 50);
    },
    [onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const r = results[selectedIndex];
        if (r) handleSelect(r);
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [results, selectedIndex, handleSelect, onClose]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl mx-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Search input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by name, title, or department…"
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-base outline-none"
          />
          {loading ? (
            <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-blue-400 rounded-full animate-spin shrink-0" />
          ) : query ? (
            <button
              onClick={() => setQuery('')}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
            >
              <X size={16} />
            </button>
          ) : (
            <kbd className="text-[11px] text-gray-500 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 shrink-0">
              Esc
            </kbd>
          )}
        </div>

        {/* Results list */}
        <div className="max-h-80 overflow-y-auto">
          {!query.trim() ? (
            <p className="text-gray-500 text-sm text-center py-10">
              Start typing to find employees…
            </p>
          ) : results.length === 0 && !loading ? (
            <p className="text-gray-500 text-sm text-center py-10">No employees found</p>
          ) : (
            results.map((r, i) => (
              <button
                key={r.id}
                onClick={() => handleSelect(r)}
                onMouseEnter={() => setSelectedIndex(i)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                  i === selectedIndex ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                )}
              >
                {/* Initials avatar */}
                <div className="w-9 h-9 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-300 text-sm font-semibold select-none">
                  {getInitials(r.name)}
                </div>
                {/* Text info */}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">{r.name}</p>
                  <p className="text-gray-400 text-xs truncate">
                    {[r.title, r.department].filter(Boolean).join(' · ')}
                    {r.managerName && (
                      <span className="text-gray-500"> · reports to {r.managerName}</span>
                    )}
                  </p>
                </div>
                {i === selectedIndex && (
                  <kbd className="text-[10px] text-gray-500 dark:text-gray-600 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1 shrink-0">
                    ↵
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer keyboard hints */}
        {results.length > 0 && (
          <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-200 dark:border-gray-700/50 text-[11px] text-gray-500 dark:text-gray-600">
            <span>
              <kbd className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1">↑↓</kbd> navigate
            </span>
            <span>
              <kbd className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1">↵</kbd> select
            </span>
            <span>
              <kbd className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1">Esc</kbd> close
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
