/**
 * Hook for cursor-based paginated issue loading
 *
 * Designed for list views where issues are loaded incrementally.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { usePaginatedQuery, useQuery } from "convex/react";
import { useCallback, useMemo } from "react";
import type { EnrichedIssue } from "../../convex/lib/issueHelpers";

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
  const {
    results: issues,
    status: queryStatus,
    loadMore: convexLoadMore,
  } = usePaginatedQuery(
    // biome-ignore lint/suspicious/noExplicitAny: paginationOpts mismatch
    api.issues.listProjectIssues as any,
    { projectId, sprintId, status },
    { initialNumItems: pageSize },
  );

  const countsData = useQuery(api.issues.getIssueCounts, {
    projectId,
    sprintId,
  });

  const totalCount = useMemo(() => {
    if (!countsData) return 0;
    if (status && countsData.byStatus?.total) {
      // biome-ignore lint/suspicious/noExplicitAny: property access on narrowed object
      return (countsData.byStatus.total as any)[status] || 0;
    }
    return countsData.total || 0;
  }, [countsData, status]);

  const loadMore = useCallback(() => {
    if (queryStatus === "CanLoadMore") {
      convexLoadMore(pageSize);
    }
  }, [queryStatus, convexLoadMore, pageSize]);

  const reset = useCallback(() => {
    // usePaginatedQuery handles reset automatically when args change
  }, []);

  return {
    // biome-ignore lint/suspicious/noExplicitAny: complex array type mismatch
    issues: (issues as any) || [],
    totalCount,
    hasMore: queryStatus === "CanLoadMore",
    loadMore,
    isLoading: queryStatus === "LoadingFirstPage",
    isLoadingMore: queryStatus === "LoadingMore",
    reset,
  };
}
