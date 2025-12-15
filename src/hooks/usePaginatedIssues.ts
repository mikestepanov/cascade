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

export interface UsePaginatedIssuesOptions {
  workspaceId: Id<"workspaces">;
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
 *   workspaceId,
 *   status: "In Progress",
 *   pageSize: 25,
 * });
 */
export function usePaginatedIssues({
  workspaceId,
  sprintId,
  status,
  pageSize = 50,
}: UsePaginatedIssuesOptions): PaginatedIssuesResult {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [accumulatedIssues, setAccumulatedIssues] = useState<EnrichedIssue[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingRef = useRef(false);
  const prevCursorRef = useRef<string | undefined>(undefined);

  // Fetch paginated issues
  const paginatedData = useQuery(api.issues.listByWorkspacePaginated, {
    workspaceId,
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
  }, [workspaceId, sprintId, status, pageSize]);

  // When data arrives after a loadMore, accumulate it
  useEffect(() => {
    if (paginatedData && cursor !== undefined && cursor !== prevCursorRef.current) {
      // New page arrived
      setAccumulatedIssues((prev) => {
        const newItems = paginatedData.items as EnrichedIssue[];
        // Deduplicate by _id
        const existingIds = new Set(prev.map((i) => i._id));
        const uniqueNewItems = newItems.filter((i) => !existingIds.has(i._id));
        return [...prev, ...uniqueNewItems];
      });
      setIsLoadingMore(false);
      loadingRef.current = false;
      prevCursorRef.current = cursor;
    }
  }, [paginatedData, cursor]);

  // Build the full issues list
  const issues = useMemo(() => {
    if (cursor === undefined) {
      // First page - use data directly
      return (paginatedData?.items as EnrichedIssue[]) ?? [];
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

    // Save current issues before changing cursor
    if (cursor === undefined) {
      setAccumulatedIssues((paginatedData.items as EnrichedIssue[]) ?? []);
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
