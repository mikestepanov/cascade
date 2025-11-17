import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { BulkOperationsBar } from "./BulkOperationsBar";
import { CreateIssueModal } from "./CreateIssueModal";
import { IssueCard } from "./IssueCard";
import { IssueDetailModal } from "./IssueDetailModal";
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

const MAX_HISTORY_SIZE = 10;

export function KanbanBoard({ projectId, sprintId }: KanbanBoardProps) {
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [createIssueStatus, setCreateIssueStatus] = useState<string>("");
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
      setRedoStack((prev) => [...prev, lastAction].slice(-MAX_HISTORY_SIZE));

      // Show toast
      toast.success(`Undid move of "${lastAction.issueTitle}"`);
    } catch {
      toast.error("Failed to undo");
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
      setHistoryStack((prev) => [...prev, lastRedo].slice(-MAX_HISTORY_SIZE));

      // Show toast
      toast.success(`Redid move of "${lastRedo.issueTitle}"`);
    } catch {
      toast.error("Failed to redo");
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

  if (!project || !issues) {
    return (
      <div className="flex-1 overflow-x-auto">
        {/* Header skeleton */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 flex items-center justify-between">
          <SkeletonText lines={1} className="w-32" />
          <SkeletonText lines={1} className="w-32" />
        </div>

        {/* Kanban columns skeleton */}
        <div className="flex space-x-3 sm:space-x-6 px-4 sm:px-6 pb-6 min-w-max">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-72 sm:w-80 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              {/* Column header skeleton */}
              <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-t-lg">
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

  const handleDragStart = (e: React.DragEvent, issueId: Id<"issues">) => {
    setDraggedIssue(issueId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();

    if (!draggedIssue) return;

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
      setHistoryStack((prev) => [...prev, action].slice(-MAX_HISTORY_SIZE));
      setRedoStack([]);
    } catch {
      toast.error("Failed to update issue status");
    }

    setDraggedIssue(null);
  };

  const handleCreateIssue = (status: string) => {
    setCreateIssueStatus(status);
    setShowCreateIssue(true);
  };

  const handleToggleSelect = (issueId: Id<"issues">) => {
    setSelectedIssueIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(issueId)) {
        newSet.delete(issueId);
      } else {
        newSet.add(issueId);
      }
      return newSet;
    });
  };

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
    <div className="flex-1 overflow-x-auto">
      {/* Header with bulk operations toggle and undo/redo buttons */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 flex items-center justify-between gap-2">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
          {sprintId ? "Sprint Board" : "Kanban Board"}
        </h2>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Undo/Redo buttons */}
          <div className="hidden sm:flex items-center gap-1 mr-2 sm:mr-4">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyStack.length === 0}
              className="p-1.5 sm:p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Undo (Ctrl+Z)"
            >
              <svg
                aria-hidden="true"
                className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1.5 sm:p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Redo (Ctrl+Shift+Z)"
            >
              <svg
                aria-hidden="true"
                className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
                />
              </svg>
            </button>
          </div>

          {/* Selection mode toggle */}
          <button
            type="button"
            onClick={handleToggleSelectionMode}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors ${
              selectionMode
                ? "bg-primary text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
            aria-label={selectionMode ? "Exit selection mode" : "Enable selection mode"}
          >
            <span className="hidden sm:inline">
              {selectionMode ? "Exit Selection Mode" : "Select Multiple"}
            </span>
            <span className="sm:hidden">{selectionMode ? "Exit" : "Select"}</span>
          </button>
        </div>
      </div>

      <div className="flex space-x-3 sm:space-x-6 px-4 sm:px-6 pb-6 min-w-max">
        {workflowStates.map((state, columnIndex) => {
          const stateIssues = issues
            .filter((issue) => issue.status === state.id)
            .sort((a, b) => a.order - b.order);

          return (
            <div
              key={state.id}
              className="flex-shrink-0 w-72 sm:w-80 bg-gray-50 dark:bg-gray-800 rounded-lg animate-slide-up"
              style={{ animationDelay: `${columnIndex * 100}ms` }}
              onDragOver={handleDragOver}
              onDrop={(e) => void handleDrop(e, state.id)}
            >
              {/* Column Header */}
              <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-t-lg">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {state.name}
                    </h3>
                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full flex-shrink-0">
                      {stateIssues.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCreateIssue(state.id)}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 flex-shrink-0"
                    aria-label={`Add issue to ${state.name}`}
                  >
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Issues */}
              <div className="p-2 space-y-2 min-h-96">
                {stateIssues.map((issue, issueIndex) => (
                  <div
                    key={issue._id}
                    className="animate-scale-in"
                    style={{ animationDelay: `${columnIndex * 100 + issueIndex * 50}ms` }}
                  >
                    <IssueCard
                      issue={issue}
                      onDragStart={(e) => handleDragStart(e, issue._id)}
                      onClick={() => !selectionMode && setSelectedIssue(issue._id)}
                      selectionMode={selectionMode}
                      isSelected={selectedIssueIds.has(issue._id)}
                      onToggleSelect={handleToggleSelect}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showCreateIssue && (
        <CreateIssueModal
          projectId={projectId}
          sprintId={sprintId}
          defaultStatus={createIssueStatus}
          onClose={() => {
            setShowCreateIssue(false);
            setCreateIssueStatus("");
          }}
        />
      )}

      {selectedIssue && (
        <IssueDetailModal issueId={selectedIssue} onClose={() => setSelectedIssue(null)} />
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
