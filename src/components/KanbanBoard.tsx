import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DISPLAY_LIMITS } from "@/lib/constants";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { BulkOperationsBar } from "./BulkOperationsBar";
import { CreateIssueModal } from "./CreateIssueModal";
import { IssueDetailModal } from "./IssueDetailModal";
import { BoardToolbar } from "./Kanban/BoardToolbar";
import { KanbanColumn } from "./Kanban/KanbanColumn";
import { SkeletonKanbanCard, SkeletonText } from "./ui/Skeleton";

interface KanbanBoardProps {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
}

interface BoardAction {
  issueId: Id<"issues">;
  oldStatus: string;
  newStatus: string;
  oldOrder: number;
  newOrder: number;
  issueTitle: string; // For toast message
}

export function KanbanBoard({ projectId, sprintId }: KanbanBoardProps) {
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [draggedIssue, setDraggedIssue] = useState<Id<"issues"> | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Id<"issues"> | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIssueIds, setSelectedIssueIds] = useState<Set<Id<"issues">>>(new Set());

  // Undo/Redo state
  const [historyStack, setHistoryStack] = useState<BoardAction[]>([]);
  const [redoStack, setRedoStack] = useState<BoardAction[]>([]);

  const project = useQuery(api.projects.get, { id: projectId });
  const issues = useQuery(api.issues.listByProject, { projectId, sprintId });
  const updateIssueStatus = useMutation(api.issues.updateStatus);

  // Undo/Redo handlers wrapped in useCallback
  const handleUndo = useCallback(async () => {
    if (historyStack.length === 0) {
      toast.info("Nothing to undo");
      return;
    }

    // Pop the last action from history
    const lastAction = historyStack[historyStack.length - 1];
    const newHistory = historyStack.slice(0, -1);

    try {
      // Revert the action (swap old/new)
      await updateIssueStatus({
        issueId: lastAction.issueId,
        newStatus: lastAction.oldStatus,
        newOrder: lastAction.oldOrder,
      });

      // Update stacks
      setHistoryStack(newHistory);
      setRedoStack((prev) => [...prev, lastAction].slice(-DISPLAY_LIMITS.MAX_HISTORY_SIZE));

      // Show toast
      showSuccess(`Undid move of "${lastAction.issueTitle}"`);
    } catch (error) {
      showError(error, "Failed to undo");
    }
  }, [historyStack, updateIssueStatus]);

  const handleRedo = useCallback(async () => {
    if (redoStack.length === 0) {
      toast.info("Nothing to redo");
      return;
    }

    // Pop the last action from redo stack
    const lastRedo = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    try {
      // Re-apply the action
      await updateIssueStatus({
        issueId: lastRedo.issueId,
        newStatus: lastRedo.newStatus,
        newOrder: lastRedo.newOrder,
      });

      // Update stacks
      setRedoStack(newRedoStack);
      setHistoryStack((prev) => [...prev, lastRedo].slice(-DISPLAY_LIMITS.MAX_HISTORY_SIZE));

      // Show toast
      showSuccess(`Redid move of "${lastRedo.issueTitle}"`);
    } catch (error) {
      showError(error, "Failed to redo");
    }
  }, [redoStack, updateIssueStatus]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isMod = e.metaKey || e.ctrlKey;

      // Ctrl+Z or Cmd+Z → Undo
      if (isMod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // Ctrl+Shift+Z or Cmd+Shift+Z → Redo
      if (isMod && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRedo, handleUndo]);

  // Memoized drag handlers - must be before early return to follow hooks rules
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

      if (!(draggedIssue && issues)) return;

      // Find the dragged issue to get its current state
      const issue = issues.find((i) => i._id === draggedIssue);
      if (!issue) return;

      // If dropping in same column, do nothing
      if (issue.status === newStatus) {
        setDraggedIssue(null);
        return;
      }

      const issuesInNewStatus = issues.filter((issue) => issue.status === newStatus);
      const newOrder = Math.max(...issuesInNewStatus.map((i) => i.order), -1) + 1;

      // Save to history before making the change
      const action: BoardAction = {
        issueId: draggedIssue,
        oldStatus: issue.status,
        newStatus,
        oldOrder: issue.order,
        newOrder,
        issueTitle: issue.title,
      };

      try {
        await updateIssueStatus({
          issueId: draggedIssue,
          newStatus,
          newOrder,
        });

        // Add to history and clear redo stack (new action invalidates redo)
        setHistoryStack((prev) => [...prev, action].slice(-DISPLAY_LIMITS.MAX_HISTORY_SIZE));
        setRedoStack([]);
      } catch (error) {
        showError(error, "Failed to update issue status");
      }

      setDraggedIssue(null);
    },
    [draggedIssue, issues, updateIssueStatus],
  );

  const handleCreateIssue = useCallback((_status: string) => {
    setShowCreateIssue(true);
  }, []);

  const handleToggleSelect = useCallback((issueId: Id<"issues">) => {
    setSelectedIssueIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(issueId)) {
        newSet.delete(issueId);
      } else {
        newSet.add(issueId);
      }
      return newSet;
    });
  }, []);

  if (!(project && issues)) {
    return (
      <div className="flex-1 overflow-x-auto">
        {/* Header skeleton */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 flex items-center justify-between">
          <SkeletonText lines={1} className="w-32" />
          <SkeletonText lines={1} className="w-32" />
        </div>

        {/* Kanban columns skeleton */}
        <div className="flex space-x-3 sm:space-x-6 px-4 sm:px-6 pb-6 overflow-x-auto -webkit-overflow-scrolling-touch">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-72 sm:w-80 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg"
            >
              {/* Column header skeleton */}
              <div className="p-3 sm:p-4 border-b border-ui-border-primary dark:border-ui-border-primary-dark bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-t-lg">
                <SkeletonText lines={1} className="w-24" />
              </div>
              {/* Column cards skeleton */}
              <div className="p-2 space-y-2 min-h-96">
                <SkeletonKanbanCard />
                <SkeletonKanbanCard />
                <SkeletonKanbanCard />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const workflowStates = project.workflowStates.sort((a, b) => a.order - b.order);

  // Only admin and editor roles can edit (create/move issues)
  const canEdit = project.userRole !== "viewer";

  const handleClearSelection = () => {
    setSelectedIssueIds(new Set());
    setSelectionMode(false);
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedIssueIds(new Set());
    }
  };

  return (
    <div className="flex-1 overflow-x-auto" data-tour="kanban-board">
      {/* Header with bulk operations toggle and undo/redo buttons */}
      <BoardToolbar
        sprintId={sprintId}
        selectionMode={selectionMode}
        historyStack={historyStack}
        redoStack={redoStack}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onToggleSelectionMode={handleToggleSelectionMode}
      />

      <div className="flex space-x-3 sm:space-x-6 px-4 sm:px-6 pb-6 overflow-x-auto -webkit-overflow-scrolling-touch">
        {workflowStates.map((state, columnIndex) => (
          <KanbanColumn
            key={state.id}
            state={state}
            issues={issues}
            columnIndex={columnIndex}
            selectionMode={selectionMode}
            selectedIssueIds={selectedIssueIds}
            canEdit={canEdit}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            onCreateIssue={handleCreateIssue}
            onIssueClick={setSelectedIssue}
            onToggleSelect={handleToggleSelect}
          />
        ))}
      </div>

      <CreateIssueModal
        projectId={projectId}
        sprintId={sprintId}
        open={showCreateIssue}
        onOpenChange={setShowCreateIssue}
      />

      {selectedIssue && (
        <IssueDetailModal
          issueId={selectedIssue}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedIssue(null);
            }
          }}
        />
      )}

      {/* Bulk Operations Bar */}
      {selectionMode && (
        <BulkOperationsBar
          projectId={projectId}
          selectedIssueIds={selectedIssueIds}
          onClearSelection={handleClearSelection}
          workflowStates={workflowStates}
        />
      )}
    </div>
  );
}
