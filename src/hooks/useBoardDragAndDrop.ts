import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useCallback, useState } from "react";
import type { EnrichedIssue, SmartBoardResponse } from "@/convex/lib/issueHelpers";
import { showError } from "@/lib/toast";
import type { BoardAction } from "./useBoardHistory";
import { type UseSmartBoardDataOptions } from "./useSmartBoardData";

interface UseBoardDragAndDropOptions {
  allIssues: EnrichedIssue[];
  issuesByStatus: Record<string, EnrichedIssue[]>;
  isTeamMode: boolean;
  pushHistoryAction: (action: BoardAction) => void;
  // Options for optimistic updating
  boardOptions?: UseSmartBoardDataOptions;
}

export function useBoardDragAndDrop({
  allIssues,
  issuesByStatus,
  isTeamMode,
  pushHistoryAction,
  boardOptions,
}: UseBoardDragAndDropOptions) {
  const [draggedIssue, setDraggedIssue] = useState<Id<"issues"> | null>(null);

  const updateIssueStatus = useMutation(api.issues.updateStatus).withOptimisticUpdate(
    (localStore, args) => {
      const { issueId, newStatus, newOrder } = args;
      const now = Date.now();

      // Update the single issue query if it exists
      const existingIssue = localStore.getQuery(api.issues.get, { id: issueId });
      if (existingIssue) {
        localStore.setQuery(
          api.issues.get,
          { id: issueId },
          { ...existingIssue, status: newStatus, order: newOrder, updatedAt: now },
        );
      }

      // Optimistic update for listByProjectSmart
      if (boardOptions && !isTeamMode) {
        const queryArgs =
          boardOptions.projectId && boardOptions.sprintId
            ? {
                projectId: boardOptions.projectId,
                sprintId: boardOptions.sprintId,
                doneColumnDays: boardOptions.doneColumnDays || 14,
              }
            : "skip";

        if (queryArgs !== "skip") {
          const currentBoard = localStore.getQuery(api.issues.listByProjectSmart, queryArgs);
          if (currentBoard) {
            // Find issue in current board
            let issueToMove: EnrichedIssue | undefined;
            // Remove from old status
            const newIssuesByStatus = { ...currentBoard.issuesByStatus };
            
            for (const status in newIssuesByStatus) {
               const issues = newIssuesByStatus[status];
               const idx = issues.findIndex(i => i._id === issueId);
               if (idx !== -1) {
                   issueToMove = { ...issues[idx], status: newStatus, order: newOrder, updatedAt: now };
                   newIssuesByStatus[status] = [...issues.slice(0, idx), ...issues.slice(idx + 1)];
                   break;
               }
            }

            // Add to new status
            if (issueToMove) {
                const targetIssues = newIssuesByStatus[newStatus] || [];
                // Sort by order to insert correctly
                const updatedTargetIssues = [...targetIssues, issueToMove].sort((a, b) => a.order - b.order);
                newIssuesByStatus[newStatus] = updatedTargetIssues;
                
                localStore.setQuery(api.issues.listByProjectSmart, queryArgs, {
                    ...currentBoard,
                    issuesByStatus: newIssuesByStatus
                });
            }
          }
        }
      }
    },
  );

  const updateStatusByCategory = useMutation(api.issues.updateStatusByCategory)
  // TODO: Add optimistic update for team mode if needed
  ;

  const handleDragStart = useCallback((e: React.DragEvent, issueId: Id<"issues">) => {
    setDraggedIssue(issueId);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, newStatus: string) => {
      e.preventDefault();

      if (!(draggedIssue && allIssues.length > 0)) return;

      const issue = allIssues.find((i) => i._id === draggedIssue);
      if (!issue) return;

      if (issue.status === newStatus) {
        setDraggedIssue(null);
        return;
      }

      // Calculate new order
      const issuesInNewStatus = issuesByStatus[newStatus] || [];
      const newOrder = Math.max(...issuesInNewStatus.map((i) => i.order), -1) + 1;

      // Action for history
      const action: BoardAction = {
        issueId: draggedIssue,
        oldStatus: issue.status,
        newStatus,
        oldOrder: issue.order,
        newOrder,
        issueTitle: issue.title,
        isTeamMode,
      };

      try {
        if (isTeamMode) {
          await updateStatusByCategory({
            issueId: draggedIssue,
            category: newStatus as "todo" | "inprogress" | "done",
            newOrder,
          });
          // Note: History not supported for team mode yet
        } else {
          await updateIssueStatus({
            issueId: draggedIssue,
            newStatus,
            newOrder,
          });
          pushHistoryAction(action);
        }
      } catch (error) {
        showError(error, "Failed to update issue status");
      }

      setDraggedIssue(null);
    },
    [
      draggedIssue,
      allIssues,
      issuesByStatus,
      updateIssueStatus,
      updateStatusByCategory,
      isTeamMode,
      pushHistoryAction,
    ],
  );

  return {
    draggedIssue,
    handleDragStart,
    handleDragOver,
    handleDrop,
  };
}
