/**
 * Fuzzy Search Hook
 *
 * Provides client-side fuzzy/typo-tolerant search using Fuse.js.
 * Use this for interactive dropdowns, autocomplete, and live filtering
 * where users might make typos or want approximate matches.
 *
 * For server-side global search with permissions, use Convex search.
 */

import Fuse from "fuse.js";
import { useMemo, useState } from "react";

export interface FuzzySearchOptions {
  /**
   * Fields to search in (supports nested paths like "user.name")
   */
  keys: Array<string | { name: string; weight?: number }>;

  /**
   * Search threshold (0.0 = exact match, 1.0 = match anything)
   * Default: 0.4 (balanced between strict and permissive)
   */
  threshold?: number;

  /**
   * Minimum character length before searching
   * Default: 1
   */
  minMatchCharLength?: number;

  /**
   * Include score in results (useful for sorting by relevance)
   * Default: true
   */
  includeScore?: boolean;

  /**
   * Maximum results to return
   * Default: undefined (no limit)
   */
  limit?: number;
}

export interface FuzzySearchResult<T> {
  /**
   * The matched item
   */
  item: T;

  /**
   * Match score (0 = perfect match, 1 = worst match)
   * Only included if includeScore is true
   */
  score?: number;

  /**
   * Indices of matched characters (for highlighting)
   */
  matches?: Array<{
    indices: Array<[number, number]>;
    key?: string;
    value?: string;
  }>;
}

/**
 * Hook for fuzzy searching through an array of items
 *
 * @example
 * ```typescript
 * const users = [
 *   { _id: "1", name: "John Doe", email: "john@example.com" },
 *   { _id: "2", name: "Jane Smith", email: "jane@example.com" }
 * ];
 *
 * const { results, search, query } = useFuzzySearch(users, {
 *   keys: ["name", "email"],
 *   threshold: 0.3
 * });
 *
 * // In your component
 * <input value={query} onChange={(e) => search(e.target.value)} />
 * {results.map(({ item, score }) => (
 *   <div key={item._id}>{item.name} (score: {score})</div>
 * ))}
 * ```
 */
export function useFuzzySearch<T>(items: T[] | undefined, options: FuzzySearchOptions) {
  const [query, setQuery] = useState("");

  // Create Fuse instance (memoized - only recreates when items/options change)
  const fuse = useMemo(() => {
    if (!items) return null;

    return new Fuse(items, {
      keys: options.keys,
      threshold: options.threshold ?? 0.4,
      minMatchCharLength: options.minMatchCharLength ?? 1,
      includeScore: options.includeScore ?? true,
      includeMatches: true, // For potential highlighting
      // Optimize for speed
      ignoreLocation: true, // Match anywhere in the string
      useExtendedSearch: false,
      findAllMatches: false,
      // Sorting
      shouldSort: true,
    });
  }, [items, options.keys, options.threshold, options.minMatchCharLength, options.includeScore]);

  // Perform search
  const results = useMemo(() => {
    if (!(fuse && query.trim())) {
      // No query - return all items
      return items?.map((item) => ({ item, score: 0 })) ?? [];
    }

    const searchResults = fuse.search(query);

    // Apply limit if specified
    const limitedResults = options.limit ? searchResults.slice(0, options.limit) : searchResults;

    return limitedResults as FuzzySearchResult<T>[];
  }, [fuse, query, items, options.limit]);

  /**
   * Update search query
   */
  const search = (newQuery: string) => {
    setQuery(newQuery);
  };

  /**
   * Clear search query
   */
  const clear = () => {
    setQuery("");
  };

  return {
    /**
     * Search results (empty query returns all items)
     */
    results,

    /**
     * Current search query
     */
    query,

    /**
     * Update search query
     */
    search,

    /**
     * Clear search
     */
    clear,

    /**
     * Whether currently searching (non-empty query)
     */
    isSearching: query.trim().length > 0,

    /**
     * Whether there are any results
     */
    hasResults: results.length > 0,
  };
}

/**
 * Pre-configured hook for searching users
 *
 * @example
 * ```typescript
 * const { results, search, query } = useUserFuzzySearch(allUsers);
 * ```
 */
export function useUserFuzzySearch(users: Array<{ name?: string; email?: string }> | undefined) {
  return useFuzzySearch(users, {
    keys: [
      { name: "name", weight: 2 }, // Prioritize name matches
      { name: "email", weight: 1 },
    ],
    threshold: 0.3, // Stricter for names
    limit: 10, // Top 10 results
  });
}

/**
 * Pre-configured hook for searching projects
 */
export function useProjectFuzzySearch(
  projects: Array<{ name: string; key: string; description?: string }> | undefined,
) {
  return useFuzzySearch(projects, {
    keys: [
      { name: "name", weight: 3 },
      { name: "key", weight: 2 },
      { name: "description", weight: 1 },
    ],
    threshold: 0.35,
    limit: 15,
  });
}

/**
 * Pre-configured hook for searching issues
 */
export function useIssueFuzzySearch(
  issues: Array<{ title: string; key: string; description?: string }> | undefined,
) {
  return useFuzzySearch(issues, {
    keys: [
      { name: "key", weight: 3 }, // PROJ-123 should match strongly
      { name: "title", weight: 2 },
      { name: "description", weight: 1 },
    ],
    threshold: 0.3,
    limit: 20,
  });
}

/**
 * Pre-configured hook for searching labels/tags
 */
export function useLabelFuzzySearch(labels: string[] | undefined) {
  return useFuzzySearch(
    labels?.map((label) => ({ label })),
    {
      keys: ["label"],
      threshold: 0.2, // Very strict for labels
      limit: 10,
    },
  );
}
