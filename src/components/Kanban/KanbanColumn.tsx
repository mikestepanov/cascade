import type { Id } from "@convex/_generated/dataModel";
import type { WorkflowState } from "@convex/shared/types";
import { memo, useCallback, useMemo } from "react";
import { ANIMATION } from "@/lib/constants";
import { getWorkflowCategoryColor } from "@/lib/issue-utils";
import { cn } from "@/lib/utils";
import type { LabelInfo } from "../../../convex/lib/issueHelpers";
import { IssueCard } from "../IssueCard";
import { Badge } from "../ui/Badge";
import { LoadMoreButton } from "../ui/LoadMoreButton";
import { PaginationInfo } from "../ui/PaginationInfo";

interface Issue {
  _id: Id<"issues">;
  title: string;
  key: string;
  status: string;
  priority: "lowest" | "low" | "medium" | "high" | "highest";
  type: "task" | "bug" | "story" | "epic" | "subtask";
  order: number;
  assignee?: {
    _id: Id<"users">;
    name: string;
    image?: string;
  } | null;
  labels: LabelInfo[];
}

interface KanbanColumnProps {
  state: WorkflowState;
  issues: Issue[];
  columnIndex: number;
  selectionMode: boolean;
  selectedIssueIds: Set<Id<"issues">>;
  canEdit: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, stateId: string) => void;
  onDragStart: (e: React.DragEvent, issueId: Id<"issues">) => void;
  onCreateIssue?: (stateId: string) => void;
  onIssueClick: (issueId: Id<"issues">) => void;
  onToggleSelect: (issueId: Id<"issues">) => void;
  focusedIssueId?: Id<"issues"> | null;
  // Pagination props (optional - for done columns)
  hiddenCount?: number;
  totalCount?: number;
  onLoadMore?: (statusId: string) => void;
  isLoadingMore?: boolean;
}

/**
 * Individual Kanban column for a workflow state
 * Extracted from KanbanBoard for better organization
 * Memoized to prevent unnecessary re-renders when other columns change
 */
export const KanbanColumn = memo(function KanbanColumn({
  state,
  issues,
  columnIndex,
  selectionMode,
  selectedIssueIds,
  focusedIssueId,
  canEdit,
  onDragOver,
  onDrop,
  onDragStart,
  onCreateIssue,
  onIssueClick,
  onToggleSelect,
  // Pagination props
  hiddenCount = 0,
  totalCount = 0,
  onLoadMore,
  isLoadingMore = false,
}: KanbanColumnProps) {
  // Issues are now pre-filtered by status from parent - memoize sorting
  const stateIssues = useMemo(() => {
    return [...issues].sort((a, b) => a.order - b.order);
  }, [issues]);

  // Memoize handlers that use state.id to preserve memo() benefits
  const handleDrop = useCallback((e: React.DragEvent) => onDrop(e, state.id), [onDrop, state.id]);

  const handleCreateIssue = useCallback(() => onCreateIssue?.(state.id), [onCreateIssue, state.id]);

  const handleLoadMore = useCallback(() => onLoadMore?.(state.id), [onLoadMore, state.id]);

  return (
    <section
      aria-label={`${state.name} column`}
      data-board-column
      className={cn(
        "flex-shrink-0 w-full lg:w-80 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg animate-slide-up border-t-4",
        getWorkflowCategoryColor(state.category),
      )}
      style={{
        animationDelay: `${columnIndex * (ANIMATION.STAGGER_DELAY * 2)}ms`,
      }}
      onDragOver={onDragOver}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="p-3 sm:p-4 border-b border-ui-border-primary dark:border-ui-border-primary-dark bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-t-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 min-w-0">
            <h3 className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark truncate">
              {state.name}
            </h3>
            <Badge variant="neutral" shape="pill" className="flex-shrink-0">
              {hiddenCount > 0 ? `${stateIssues.length}/${totalCount}` : stateIssues.length}
            </Badge>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={handleCreateIssue}
              className="text-ui-text-tertiary dark:text-ui-text-tertiary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark p-2.5 sm:p-3 flex-shrink-0"
              aria-label={`Add issue to ${state.name}`}
              {...(columnIndex === 0 ? { "data-tour": "create-issue" } : {})}
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
          )}
        </div>
      </div>

      {/* Issues */}
      <div className="p-2 space-y-2 min-h-96">
        {stateIssues.map((issue, issueIndex) => (
          <div
            key={issue._id}
            className="animate-scale-in"
            style={{
              animationDelay: `${columnIndex * (ANIMATION.STAGGER_DELAY * 2) + issueIndex * ANIMATION.STAGGER_DELAY}ms`,
            }}
          >
            <IssueCard
              issue={issue}
              onDragStart={onDragStart}
              onClick={onIssueClick}
              selectionMode={selectionMode}
              isSelected={selectedIssueIds.has(issue._id)}
              isFocused={issue._id === focusedIssueId}
              onToggleSelect={onToggleSelect}
              canEdit={canEdit}
            />
          </div>
        ))}

        {/* Load More Button for done columns with hidden items */}
        {onLoadMore && hiddenCount > 0 && (
          <div className="pt-2">
            <LoadMoreButton
              onClick={handleLoadMore}
              isLoading={isLoadingMore}
              remainingCount={hiddenCount}
              className="w-full"
            />
          </div>
        )}

        {/* Pagination info when there are hidden items */}
        {hiddenCount > 0 && (
          <PaginationInfo
            loaded={stateIssues.length}
            total={totalCount}
            itemName="issues"
            className="text-center pt-1"
          />
        )}
      </div>
    </section>
  );
});
