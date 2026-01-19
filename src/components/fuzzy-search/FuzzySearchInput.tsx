/**
 * Reusable Fuzzy Search Input Component
 *
 * A production-ready search input with fuzzy matching, highlighting,
 * and keyboard navigation support.
 */

import { useEffect, useRef, useState } from "react";
import { type FuzzySearchResult, highlightMatches } from "@/hooks/useFuzzySearch";
import { cn } from "@/lib/utils";

interface FuzzySearchInputProps<T> {
  /**
   * Search results from useFuzzySearch hook
   */
  results: FuzzySearchResult<T>[];

  /**
   * Current query value
   */
  query: string;

  /**
   * Search function from hook
   */
  onSearch: (query: string) => void;

  /**
   * Called when user selects an item
   */
  onSelect: (item: T) => void;

  /**
   * Called when input is cleared
   */
  onClear?: () => void;

  /**
   * Render function for each result item
   */
  renderItem: (result: FuzzySearchResult<T>) => React.ReactNode;

  /**
   * Get unique key for each item
   */
  getKey: (item: T) => string;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Whether to show scores
   */
  showScore?: boolean;

  /**
   * Whether results dropdown is open
   */
  isOpen?: boolean;

  /**
   * Loading state (for debouncing)
   */
  isLoading?: boolean;

  /**
   * CSS classes for input
   */
  className?: string;

  /**
   * Aria label for accessibility
   */
  "aria-label"?: string;
}

export function FuzzySearchInput<T>({
  results,
  query,
  onSearch,
  onSelect,
  onClear,
  renderItem,
  getKey,
  placeholder = "Search...",
  showScore = false,
  isOpen = true,
  isLoading = false,
  className = "",
  "aria-label": ariaLabel,
}: FuzzySearchInputProps<T>) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Show dropdown when there's a query or results
  const showDropdown = isOpen && isDropdownOpen && (query.length > 0 || results.length > 0);

  // Reset selected index when results change
  // Reset selected index when results change (Derived State Pattern)
  const [prevResults, setPrevResults] = useState(results);
  if (results !== prevResults) {
    setPrevResults(results);
    setSelectedIndex(0);
  }

  // Open dropdown when query changes
  useEffect(() => {
    if (query.length > 0) {
      setIsDropdownOpen(true);
    }
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
        break;

      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        break;

      case "Enter":
        e.preventDefault();
        if (results[selectedIndex]) {
          onSelect(results[selectedIndex].item);
          setIsDropdownOpen(false);
          onSearch("");
        }
        break;

      case "Escape":
        e.preventDefault();
        setIsDropdownOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClear = () => {
    onSearch("");
    setIsDropdownOpen(false);
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsDropdownOpen(true)}
          placeholder={placeholder}
          aria-label={ariaLabel || placeholder}
          aria-autocomplete="list"
          aria-controls="fuzzy-search-results"
          aria-expanded={showDropdown}
          className={cn(
            "w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-ui-bg-secondary-dark dark:text-ui-text-primary-dark",
            className,
          )}
        />

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full" />
          </div>
        )}

        {/* Clear button */}
        {query.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ui-text-tertiary hover:text-ui-text-secondary"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <title>Clear</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          id="fuzzy-search-results"
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-ui-bg-primary border border-ui-border-secondary rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-ui-text-tertiary">
              No results found for "{query}"
            </div>
          ) : (
            results.map((result, index) => (
              <button
                type="button"
                key={getKey(result.item)}
                role="option"
                aria-selected={index === selectedIndex}
                onClick={() => {
                  onSelect(result.item);
                  setIsDropdownOpen(false);
                  onSearch("");
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  "w-full px-4 py-2 text-left hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark flex items-center justify-between",
                  index === selectedIndex && "bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark",
                )}
              >
                <div className="flex-1">{renderItem(result)}</div>
                {showScore && result.score !== undefined && result.score > 0 && (
                  <span className="text-xs text-ui-text-tertiary ml-2">
                    {((1 - result.score) * 100).toFixed(0)}%
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Highlighted Text Component
 *
 * Renders text with highlighted matches from fuzzy search
 */
export function HighlightedText({
  text,
  matches,
  className = "",
  highlightClassName = "bg-status-warning-bg font-semibold",
}: {
  text: string;
  matches?: Array<[number, number]>;
  className?: string;
  highlightClassName?: string;
}) {
  const parts = highlightMatches(text, matches);

  return (
    <span className={className}>
      {parts.map((part, index) => (
        <span key={`${index}-${part.text}`} className={part.highlight ? highlightClassName : ""}>
          {part.text}
        </span>
      ))}
    </span>
  );
}
