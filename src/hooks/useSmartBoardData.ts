/**
 * Hook for smart board data loading with pagination support
 *
 * Uses smart loading strategy:
 * - todo/inprogress columns: load all issues
 * - done column: load only recent issues (last 14 days by default)
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EnrichedIssue } from "../../convex/lib/issueHelpers";

/** Type guard to validate EnrichedIssue array structure */
function isEnrichedIssueArray(data: unknown): data is EnrichedIssue[] {
  if (!Array.isArray(data)) return false;
  // Validate first item has required fields (lightweight check)
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
  return true; // Empty array is valid
}

export interface UseSmartBoardDataOptions {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
  doneColumnDays?: number;
}

export interface SmartBoardData {
  /** Issues grouped by status */
  issuesByStatus: Record<string, EnrichedIssue[]>;
  /** Counts per status (total, loaded, hidden) */
  statusCounts: Record<
    string,
    {
      total: number;
      loaded: number;
      hidden: number;
    }
  >;
  /** Whether data is loading */
  isLoading: boolean;
  /** Done statuses that have more items to load */
  doneStatusesWithMore: string[];
  /** Load more done issues for a specific status */
  loadMoreDone: (status: string) => void;
  /** Whether more done issues are loading */
  isLoadingMore: boolean;
  /** Total hidden done count across all done statuses */
  hiddenDoneCount: number;
}

/**
 * Hook for smart Kanban board data loading
 *
 * @example
 * const {
 *   issuesByStatus,
 *   statusCounts,
 *   doneStatusesWithMore,
 *   loadMoreDone,
 *   hiddenDoneCount,
 * } = useSmartBoardData({
 *   projectId,
 *   sprintId: activeSprint?._id,
 * });
 */
export function useSmartBoardData({
  projectId,
  sprintId,
  doneColumnDays = 14,
}: UseSmartBoardDataOptions): SmartBoardData {
  // Track expanded done issues loaded via loadMoreDoneIssues
  const [additionalDoneIssues, setAdditionalDoneIssues] = useState<EnrichedIssue[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreCursor, setLoadMoreCursor] = useState<
    { timestamp: number; id: string } | undefined
  >(undefined);
  const loadingRef = useRef(false);

  // Fetch smart-loaded issues (done column filtered by date)
  const smartData = useQuery(api.issues.listByWorkspaceSmart, {
    projectId,
    sprintId,
    doneColumnDays,
  });

  // Fetch counts to know how many are hidden
  const countsData = useQuery(api.issues.getIssueCounts, {
    projectId,
    sprintId,
    doneColumnDays,
  });

  // Fetch additional done issues when cursor is set
  const moreDoneData = useQuery(
    api.issues.loadMoreDoneIssues,
    loadMoreCursor !== undefined
      ? {
          projectId,
          sprintId,
          beforeTimestamp: loadMoreCursor.timestamp,
          beforeId: loadMoreCursor.id,
          limit: 50,
        }
      : "skip",
  );

  // When more done issues arrive, merge them
  // Note: We check moreDoneData directly, not loadingRef, to avoid race conditions
  // where the effect runs before the ref is set
  useEffect(() => {
    if (moreDoneData && isEnrichedIssueArray(moreDoneData.items)) {
      setAdditionalDoneIssues((prev) => [...prev, ...moreDoneData.items]);
      setIsLoadingMore(false);
      loadingRef.current = false;
    }
  }, [moreDoneData]);

  // Reset additional issues when project/sprint changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on filter change
  useEffect(() => {
    setAdditionalDoneIssues([]);
    setLoadMoreCursor(undefined);
  }, [projectId, sprintId]);

  // Build issues by status, merging additional done issues
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: complex merging logic required
  const issuesByStatus = useMemo(() => {
    const result: Record<string, EnrichedIssue[]> = {};

    if (smartData?.issuesByStatus) {
      for (const [status, issues] of Object.entries(smartData.issuesByStatus)) {
        if (isEnrichedIssueArray(issues)) {
          result[status] = [...issues];
        }
      }
    }

    // Merge additional done issues into their respective statuses
    for (const issue of additionalDoneIssues) {
      if (!result[issue.status]) {
        result[issue.status] = [];
      }
      // Avoid duplicates
      if (!result[issue.status].some((i) => i._id === issue._id)) {
        result[issue.status].push(issue);
      }
    }

    return result;
  }, [smartData?.issuesByStatus, additionalDoneIssues]);

  // Build status counts from countsData.byStatus
  const statusCounts = useMemo(() => {
    const result: Record<string, { total: number; loaded: number; hidden: number }> = {};

    if (countsData?.byStatus) {
      const { total, visible, hidden } = countsData.byStatus;

      // Get all unique statuses
      const allStatuses = new Set([
        ...Object.keys(total),
        ...Object.keys(visible),
        ...Object.keys(hidden),
      ]);

      for (const status of allStatuses) {
        const totalCount = total[status] || 0;
        const loadedInView = issuesByStatus[status]?.length || 0;
        const hiddenCount = Math.max(0, totalCount - loadedInView);

        result[status] = {
          total: totalCount,
          loaded: loadedInView,
          hidden: hiddenCount,
        };
      }
    }

    return result;
  }, [countsData?.byStatus, issuesByStatus]);

  // Find done statuses that have more items to load
  const doneStatusesWithMore = useMemo(() => {
    const result: string[] = [];
    for (const [status, counts] of Object.entries(statusCounts)) {
      if (counts.hidden > 0) {
        result.push(status);
      }
    }
    return result;
  }, [statusCounts]);

  // Calculate total hidden done count
  const hiddenDoneCount = useMemo(() => {
    const baseHidden = smartData?.hiddenDoneCount ?? 0;
    return Math.max(0, baseHidden - additionalDoneIssues.length);
  }, [smartData?.hiddenDoneCount, additionalDoneIssues.length]);

  // Collect all issues for finding oldest
  const allLoadedIssues = useMemo(() => {
    const issues: EnrichedIssue[] = [...additionalDoneIssues];
    if (smartData?.issuesByStatus) {
      for (const statusIssues of Object.values(smartData.issuesByStatus)) {
        if (isEnrichedIssueArray(statusIssues)) {
          issues.push(...statusIssues);
        }
      }
    }
    return issues;
  }, [additionalDoneIssues, smartData?.issuesByStatus]);

  // Find the oldest issue (by timestamp) for cursor
  const findOldestIssue = useCallback((): { timestamp: number; id: string } | undefined => {
    if (allLoadedIssues.length === 0) return undefined;

    const oldest = allLoadedIssues.reduce((min, issue) =>
      issue.updatedAt < min.updatedAt ? issue : min,
    );
    return { timestamp: oldest.updatedAt, id: oldest._id.toString() };
  }, [allLoadedIssues]);

  // Load more done issues handler
  const loadMoreDone = useCallback(
    (_status: string) => {
      // Double-check with ref and state to prevent race conditions from rapid clicks
      if (loadingRef.current || isLoadingMore) return;

      loadingRef.current = true;
      setIsLoadingMore(true);
      setLoadMoreCursor(findOldestIssue());
    },
    [isLoadingMore, findOldestIssue],
  );

  return {
    issuesByStatus,
    statusCounts,
    isLoading: smartData === undefined || countsData === undefined,
    doneStatusesWithMore,
    loadMoreDone,
    isLoadingMore,
    hiddenDoneCount,
  };
}
