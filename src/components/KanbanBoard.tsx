import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { WorkflowState } from "@convex/shared/types";
import { useQuery } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { useBoardDragAndDrop } from "@/hooks/useBoardDragAndDrop";
import { useBoardHistory } from "@/hooks/useBoardHistory";
import { useListNavigation } from "@/hooks/useListNavigation";
import { useSmartBoardData } from "@/hooks/useSmartBoardData";
import { BulkOperationsBar } from "./BulkOperationsBar";
import { CreateIssueModal } from "./CreateIssueModal";
import { IssueDetailModal } from "./IssueDetailModal";
import { BoardToolbar } from "./Kanban/BoardToolbar";
import { KanbanColumn } from "./Kanban/KanbanColumn";
import { SkeletonKanbanCard, SkeletonText } from "./ui/Skeleton";

interface KanbanBoardProps {
  projectId?: Id<"projects">;
  teamId?: Id<"teams">;
  sprintId?: Id<"sprints">;
}

export function KanbanBoard({ projectId, teamId, sprintId }: KanbanBoardProps) {
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Id<"issues"> | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIssueIds, setSelectedIssueIds] = useState<Set<Id<"issues">>>(new Set());

  const isTeamMode = !!teamId;
  const isProjectMode = !!projectId;

  const project = useQuery(
    api.projects.getProject,
    isProjectMode && projectId ? { id: projectId } : "skip",
  );

  // Custom Hooks
  const {
    issuesByStatus,
    statusCounts,
    isLoading: isLoadingIssues,
    loadMoreDone,
    isLoadingMore,
    workflowStates: smartWorkflowStates,
  } = useSmartBoardData({ projectId, teamId, sprintId });

  const { historyStack, redoStack, handleUndo, handleRedo, pushAction } = useBoardHistory();

  const allIssues = useMemo(() => {
    return Object.values(issuesByStatus).flat();
  }, [issuesByStatus]);

  // Keyboard Navigation
  const { selectedIndex } = useListNavigation({
    items: allIssues,
    onSelect: (issue) => setSelectedIssue(issue._id),
  });
  const focusedIssueId = allIssues[selectedIndex]?._id;

  const { handleDragStart, handleDragOver, handleDrop } = useBoardDragAndDrop({
    allIssues,
    issuesByStatus,
    isTeamMode,
    pushHistoryAction: pushAction,
    boardOptions: { projectId, teamId, sprintId, doneColumnDays: 14 },
  });

  // Handlers
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

  const handleClearSelection = useCallback(() => {
    setSelectedIssueIds(new Set());
    setSelectionMode(false);
  }, []);

  const handleToggleSelectionMode = useCallback(() => {
    setSelectionMode((prev) => {
      if (!prev) setSelectedIssueIds(new Set());
      return !prev;
    });
  }, []);

  // Loading State
  const isLoading = isLoadingIssues || (isProjectMode && !project);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-x-auto">
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 flex items-center justify-between">
          <SkeletonText lines={1} className="w-32" />
          <SkeletonText lines={1} className="w-32" />
        </div>
        <div className="flex space-x-3 sm:space-x-6 px-4 sm:px-6 pb-6 overflow-x-auto">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-72 sm:w-80 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg"
            >
              <div className="p-3 sm:p-4 border-b border-ui-border-primary dark:border-ui-border-primary-dark bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-t-lg">
                <SkeletonText lines={1} className="w-24" />
              </div>
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

  // Determine Workflow States
  let workflowStates: WorkflowState[] = [];

  if (isProjectMode && project) {
    workflowStates = project.workflowStates.sort(
      (a: { order: number }, b: { order: number }) => a.order - b.order,
    );
  } else if (isTeamMode && smartWorkflowStates) {
    workflowStates = smartWorkflowStates.map((s) => ({
      ...s,
      color:
        s.category === "todo" ? "#94a3b8" : s.category === "inprogress" ? "#3b82f6" : "#22c55e",
      description: "",
      order: s.order,
    }));
  }

  const canEdit = isProjectMode ? project?.userRole !== "viewer" : true;

  return (
    <div className="flex-1 overflow-x-auto" data-tour="kanban-board">
      <BoardToolbar
        sprintId={sprintId}
        selectionMode={selectionMode}
        historyStack={historyStack}
        redoStack={redoStack}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onToggleSelectionMode={handleToggleSelectionMode}
        showControls={!isTeamMode}
      />

      <div className="flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6 px-4 lg:px-6 pb-6 lg:overflow-x-auto -webkit-overflow-scrolling-touch">
        {workflowStates.map((state, columnIndex: number) => {
          const counts = statusCounts[state.id] || {
            total: 0,
            loaded: 0,
            hidden: 0,
          };
          return (
            <KanbanColumn
              key={state.id}
              state={state}
              issues={issuesByStatus[state.id] || []}
              columnIndex={columnIndex}
              selectionMode={selectionMode}
              selectedIssueIds={selectedIssueIds}
              focusedIssueId={focusedIssueId}
              canEdit={canEdit}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragStart={handleDragStart}
              onCreateIssue={isTeamMode || !canEdit ? undefined : handleCreateIssue}
              onIssueClick={setSelectedIssue}
              onToggleSelect={handleToggleSelect}
              hiddenCount={counts.hidden}
              totalCount={counts.total}
              onLoadMore={loadMoreDone}
              isLoadingMore={isLoadingMore}
            />
          );
        })}
      </div>

      {isProjectMode && (
        <CreateIssueModal
          projectId={projectId}
          sprintId={sprintId}
          open={showCreateIssue}
          onOpenChange={setShowCreateIssue}
        />
      )}

      {selectedIssue && (
        <IssueDetailModal
          issueId={selectedIssue}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedIssue(null);
            }
          }}
          canEdit={canEdit}
        />
      )}

      {selectionMode && isProjectMode && projectId && (
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
