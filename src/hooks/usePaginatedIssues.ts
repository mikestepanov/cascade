/**
 * Hook for cursor-based paginated issue loading
 *
 * Designed for list views where issues are loaded incrementally.
 */

import { useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { EnrichedIssue } from "../../convex/lib/issueHelpers";

/** Type guard to validate EnrichedIssue array structure */
function isEnrichedIssueArray(data: unknown): data is EnrichedIssue[] {
  if (!Array.isArray(data)) return false;
  if (data.length > 0) {
    const first = data[0];
    return (
      typeof first === "object" &&
      first !== null &&
      "_id" in first &&
      "status" in first &&
      "updatedAt" in first
    );
  }
  return true;
}

export interface UsePaginatedIssuesOptions {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
  status?: string;
  pageSize?: number;
}

export interface PaginatedIssuesResult {
  /** Loaded issues */
  issues: EnrichedIssue[];
  /** Total count of issues matching the query */
  totalCount: number;
  /** Whether there are more issues to load */
  hasMore: boolean;
  /** Load the next page of issues */
  loadMore: () => void;
  /** Whether initial data is loading */
  isLoading: boolean;
  /** Whether more data is being loaded */
  isLoadingMore: boolean;
  /** Reset pagination to start */
  reset: () => void;
}

/**
 * Hook for paginated issue loading in list views
 *
 * @example
 * const {
 *   issues,
 *   totalCount,
 *   hasMore,
 *   loadMore,
 *   isLoading,
 * } = usePaginatedIssues({
 *   projectId,
 *   status: "In Progress",
 *   pageSize: 25,
 * });
 */
export function usePaginatedIssues({
  projectId,
  sprintId,
  status,
  pageSize = 50,
}: UsePaginatedIssuesOptions): PaginatedIssuesResult {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [accumulatedIssues, setAccumulatedIssues] = useState<EnrichedIssue[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingRef = useRef(false);
  const prevCursorRef = useRef<string | undefined>(undefined);
  const initialPageSavedRef = useRef(false);

  // Fetch paginated issues
  const paginatedData = useQuery(api.issues.listByWorkspacePaginated, {
    projectId,
    sprintId,
    status,
    cursor,
    pageSize,
  });

  // Reset when filters change
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on filter change
  useEffect(() => {
    setCursor(undefined);
    setAccumulatedIssues([]);
    setIsLoadingMore(false);
    loadingRef.current = false;
    prevCursorRef.current = undefined;
    initialPageSavedRef.current = false;
  }, [projectId, sprintId, status, pageSize]);

  // When data arrives after a loadMore, accumulate it
  useEffect(() => {
    if (paginatedData && cursor !== undefined && cursor !== prevCursorRef.current) {
      // New page arrived - validate and accumulate
      if (isEnrichedIssueArray(paginatedData.items)) {
        setAccumulatedIssues((prev) => {
          const newItems = paginatedData.items;
          // Deduplicate by _id
          const existingIds = new Set(prev.map((i) => i._id));
          const uniqueNewItems = newItems.filter((i) => !existingIds.has(i._id));
          return [...prev, ...uniqueNewItems];
        });
      }
      setIsLoadingMore(false);
      loadingRef.current = false;
      prevCursorRef.current = cursor;
    }
  }, [paginatedData, cursor]);

  // Build the full issues list
  const issues = useMemo(() => {
    if (cursor === undefined) {
      // First page - use data directly with validation
      if (paginatedData?.items && isEnrichedIssueArray(paginatedData.items)) {
        return paginatedData.items;
      }
      return [];
    }
    // Subsequent pages - use accumulated issues
    return accumulatedIssues;
  }, [cursor, paginatedData?.items, accumulatedIssues]);

  // Load more handler
  const loadMore = useCallback(() => {
    if (!(paginatedData?.hasMore && paginatedData.nextCursor) || loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setIsLoadingMore(true);

    // Save current issues before changing cursor (use ref to prevent race condition)
    if (cursor === undefined && !initialPageSavedRef.current) {
      initialPageSavedRef.current = true;
      if (isEnrichedIssueArray(paginatedData.items)) {
        setAccumulatedIssues(paginatedData.items);
      }
    }

    setCursor(paginatedData.nextCursor);
  }, [paginatedData, cursor]);

  // Reset pagination
  const reset = useCallback(() => {
    setCursor(undefined);
    setAccumulatedIssues([]);
    setIsLoadingMore(false);
    loadingRef.current = false;
    prevCursorRef.current = undefined;
    initialPageSavedRef.current = false;
  }, []);

  return {
    issues,
    totalCount: paginatedData?.totalCount ?? 0,
    hasMore: paginatedData?.hasMore ?? false,
    loadMore,
    isLoading: paginatedData === undefined && cursor === undefined,
    isLoadingMore,
    reset,
  };
}
