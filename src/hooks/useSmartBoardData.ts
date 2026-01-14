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

function mergeIssuesByStatus(
  smartIssues: Record<string, EnrichedIssue[]> | undefined,
  additionalIssues: EnrichedIssue[],
) {
  const result: Record<string, EnrichedIssue[]> = {};

  if (smartIssues) {
    for (const [status, issues] of Object.entries(smartIssues)) {
      // Optimization: Preserve the original array reference
      // instead of creating a shallow copy with [...issues]
      // This allows downstream memoized components (KanbanColumn) to skip re-renders
      // if the issue list for a column hasn't changed.
      // Note: This reference may be replaced with a copy later if additional issues
      // need to be merged (see isOriginalRef check below)
      result[status] = issues;
    }
  }

  // Merge additional done issues into their respective statuses
  for (const issue of additionalIssues) {
    const status = issue.status;
    const existingIssues = result[status];

    // If no existing issues for this status, create a new array
    if (!existingIssues) {
      result[status] = [issue];
      continue;
    }

    // Check for duplicates to avoid adding the same issue twice
    if (existingIssues.some((i) => i._id === issue._id)) {
      continue;
    }

    // Determine if the current array is the original reference from smartIssues
    // If so, we MUST copy it before modifying to avoid mutating the source data
    const isOriginalRef = smartIssues && smartIssues[status] === existingIssues;

    if (isOriginalRef) {
      // It's the original reference, so we MUST copy before modifying
      result[status] = [...existingIssues, issue];
    } else {
      // It's already a copy or a new array we created in this loop, so we can safely mutate
      existingIssues.push(issue);
    }
  }

  return result;
}

export interface UseSmartBoardDataOptions {
  projectId?: Id<"projects">;
  teamId?: Id<"teams">;
  sprintId?: Id<"sprints">;
  doneColumnDays?: number;
}

export interface SmartBoardData {
  issuesByStatus: Record<string, EnrichedIssue[]>;
  statusCounts: Record<
    string,
    {
      total: number;
      loaded: number;
      hidden: number;
    }
  >;
  isLoading: boolean;
  doneStatusesWithMore: string[];
  loadMoreDone: (status: string) => void;
  isLoadingMore: boolean;
  hiddenDoneCount: number;
  workflowStates?: {
    id: string;
    name: string;
    category: "todo" | "inprogress" | "done";
    order: number;
  }[];
}

function calculateStatusCounts(
  countsData:
    | {
        byStatus: {
          total: Record<string, number>;
          visible: Record<string, number>;
          hidden: Record<string, number>;
        };
      }
    | undefined,
  issuesByStatus: Record<string, EnrichedIssue[]>,
) {
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
}

function getAllLoadedIssues(
  additionalDoneIssues: EnrichedIssue[],
  smartData?: { issuesByStatus?: Record<string, EnrichedIssue[]> },
) {
  const issues: EnrichedIssue[] = [...additionalDoneIssues];
  if (smartData?.issuesByStatus) {
    for (const statusIssues of Object.values(smartData.issuesByStatus)) {
      issues.push(...(Array.isArray(statusIssues) ? statusIssues : []));
    }
  }
  return issues;
}

function getSmartQueryArgs(
  isTeamMode: boolean,
  isProjectMode: boolean,
  teamId?: Id<"teams">,
  projectId?: Id<"projects">,
  sprintId?: Id<"sprints">,
  doneColumnDays?: number,
) {
  if (isTeamMode && teamId) {
    return { teamId, doneColumnDays };
  }
  if (isProjectMode && projectId) {
    return { projectId, sprintId, doneColumnDays };
  }
  return "skip";
}

function getLoadMoreArgs(
  isTeamMode: boolean,
  loadMoreCursor: { timestamp: number; id: string } | undefined,
  projectId?: Id<"projects">,
  sprintId?: Id<"sprints">,
) {
  if (!isTeamMode && loadMoreCursor !== undefined && projectId) {
    return {
      projectId,
      sprintId,
      beforeTimestamp: loadMoreCursor.timestamp,
      beforeId: loadMoreCursor.id,
      limit: 50,
    };
  }
  return "skip";
}

export function useSmartBoardData({
  projectId,
  teamId,
  sprintId,
  doneColumnDays = 14,
}: UseSmartBoardDataOptions): SmartBoardData {
  const [additionalDoneIssues, setAdditionalDoneIssues] = useState<EnrichedIssue[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreCursor, setLoadMoreCursor] = useState<
    { timestamp: number; id: string } | undefined
  >(undefined);
  const loadingRef = useRef(false);

  // Determine which mode we are in
  const isTeamMode = !!teamId;
  const isProjectMode = !!projectId;

  const queryArgs = getSmartQueryArgs(
    isTeamMode,
    isProjectMode,
    teamId,
    projectId,
    sprintId,
    doneColumnDays,
  );

  // Fetch smart-loaded issues
  const smartData = useQuery(
    isTeamMode ? api.issues.listByTeamSmart : api.issues.listByProjectSmart,
    queryArgs,
  );

  const countsData = useQuery(
    isTeamMode ? api.issues.getTeamIssueCounts : api.issues.getIssueCounts,
    queryArgs,
  );

  const moreDoneData = useQuery(
    api.issues.loadMoreDoneIssues,
    getLoadMoreArgs(isTeamMode, loadMoreCursor, projectId, sprintId),
  );

  // When more done issues arrive, merge them
  useEffect(() => {
    if (moreDoneData && isEnrichedIssueArray(moreDoneData.items)) {
      setAdditionalDoneIssues((prev) => [...prev, ...moreDoneData.items]);
      setIsLoadingMore(false);
      loadingRef.current = false;
    }
  }, [moreDoneData]);

  // Reset additional issues when project/sprint changes (Derived State Pattern)
  const currentKey = `${projectId || ""}-${sprintId || ""}-${teamId || ""}`;
  const [prevKey, setPrevKey] = useState(currentKey);

  if (currentKey !== prevKey) {
    setPrevKey(currentKey);
    setAdditionalDoneIssues([]);
    setLoadMoreCursor(undefined);
  }

  // Build issues by status
  const issuesByStatus = useMemo(() => {
    return mergeIssuesByStatus(smartData?.issuesByStatus, additionalDoneIssues);
  }, [smartData?.issuesByStatus, additionalDoneIssues]);

  // Build status counts from countsData.byStatus
  const statusCounts = useMemo(() => {
    return calculateStatusCounts(countsData, issuesByStatus);
  }, [countsData, issuesByStatus]);

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

  // Calculate total hidden done count from accurate statusCounts
  const hiddenDoneCount = useMemo(() => {
    let total = 0;
    for (const counts of Object.values(statusCounts)) {
      total += counts.hidden;
    }
    return total;
  }, [statusCounts]);

  // Helper for loadMoreDone
  const findOldestIssue = useCallback(() => {
    const allLoadedIssues = getAllLoadedIssues(additionalDoneIssues, smartData);
    if (allLoadedIssues.length === 0) return undefined;

    const oldest = allLoadedIssues.reduce((min: EnrichedIssue, issue: EnrichedIssue) =>
      issue.updatedAt < min.updatedAt ? issue : min,
    );
    return { timestamp: oldest.updatedAt, id: oldest._id.toString() };
  }, [additionalDoneIssues, smartData]);

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
    workflowStates: smartData?.workflowStates,
  };
}
