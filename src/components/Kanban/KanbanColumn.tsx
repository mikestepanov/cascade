import type { Id } from "@convex/_generated/dataModel";
import type { WorkflowState } from "@convex/shared/types";
import { Plus } from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import { Flex } from "@/components/ui/Flex";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
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
        "flex-shrink-0 w-full lg:w-80 bg-ui-bg-secondary rounded-lg animate-slide-up border-t-4",
        getWorkflowCategoryColor(state.category),
      )}
      style={{
        animationDelay: `${columnIndex * (ANIMATION.STAGGER_DELAY * 2)}ms`,
      }}
      onDragOver={onDragOver}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="p-3 sm:p-4 border-b border-ui-border-primary bg-ui-bg-primary rounded-t-lg">
        <Flex align="center" justify="between" gap="sm">
          <Flex align="center" className="space-x-2 min-w-0">
            <Typography variant="h3" className="font-medium text-ui-text-primary truncate">
              {state.name}
            </Typography>
            <Badge variant="neutral" shape="pill" className="shrink-0">
              {hiddenCount > 0 ? `${stateIssues.length}/${totalCount}` : stateIssues.length}
            </Badge>
          </Flex>
          {canEdit && (
            <Tooltip content="Create issue">
              <button
                type="button"
                onClick={handleCreateIssue}
                className="text-ui-text-tertiary hover:text-ui-text-primary p-2.5 sm:p-3 shrink-0"
                aria-label={`Add issue to ${state.name}`}
                {...(columnIndex === 0 ? { "data-tour": "create-issue" } : {})}
              >
                <Plus className="w-4 h-4" />
              </button>
            </Tooltip>
          )}
        </Flex>
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
