import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useCallback, useState } from "react";
import type { EnrichedIssue } from "@/convex/lib/issueHelpers";
import { showError } from "@/lib/toast";
import type { BoardAction } from "./useBoardHistory";

interface UseBoardDragAndDropOptions {
  allIssues: EnrichedIssue[];
  issuesByStatus: Record<string, EnrichedIssue[]>;
  isTeamMode: boolean;
  pushHistoryAction: (action: BoardAction) => void;
}

export function useBoardDragAndDrop({
  allIssues,
  issuesByStatus,
  isTeamMode,
  pushHistoryAction,
}: UseBoardDragAndDropOptions) {
  const [draggedIssue, setDraggedIssue] = useState<Id<"issues"> | null>(null);

  const updateIssueStatus = useMutation(api.issues.updateStatus);
  const updateStatusByCategory = useMutation(api.issues.updateStatusByCategory);

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

      // In team mode, newStatus is the category key.
      // We check if the column is logically the same.
      // For simple drag/drop, we just check if it's the exact same string key.
      if (issue.status === newStatus) {
        // Optimization: check if we need to reorder?
        // For now, simple return as per original
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
