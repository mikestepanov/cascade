import { ANIMATION } from "@/lib/constants";
import type { Id } from "../../../convex/_generated/dataModel";
import { IssueCard } from "../IssueCard";

interface WorkflowState {
  id: string;
  name: string;
  category: string;
  order: number;
}

interface Issue {
  _id: Id<"issues">;
  title: string;
  key: string;
  status: string;
  priority: string;
  type: string;
  order: number;
  assignee?: { name: string } | null;
}

interface KanbanColumnProps {
  state: WorkflowState;
  issues: Issue[];
  columnIndex: number;
  selectionMode: boolean;
  selectedIssueIds: Set<Id<"issues">>;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, stateId: string) => void;
  onDragStart: (e: React.DragEvent, issueId: Id<"issues">) => void;
  onCreateIssue: (stateId: string) => void;
  onIssueClick: (issueId: Id<"issues">) => void;
  onToggleSelect: (issueId: Id<"issues">) => void;
}

/**
 * Individual Kanban column for a workflow state
 * Extracted from KanbanBoard for better organization
 */
export function KanbanColumn({
  state,
  issues,
  columnIndex,
  selectionMode,
  selectedIssueIds,
  onDragOver,
  onDrop,
  onDragStart,
  onCreateIssue,
  onIssueClick,
  onToggleSelect,
}: KanbanColumnProps) {
  const stateIssues = issues
    .filter((issue) => issue.status === state.id)
    .sort((a, b) => a.order - b.order);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Drag-and-drop zone requires these event handlers
    <div
      className="flex-shrink-0 w-64 sm:w-72 md:w-80 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg animate-slide-up"
      style={{ animationDelay: `${columnIndex * (ANIMATION.STAGGER_DELAY * 2)}ms` }}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, state.id)}
    >
      {/* Column Header */}
      <div className="p-3 sm:p-4 border-b border-ui-border-primary dark:border-ui-border-primary-dark bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-t-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 min-w-0">
            <h3 className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark truncate">
              {state.name}
            </h3>
            <span className="bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-ui-text-primary dark:text-ui-text-primary-dark text-xs px-2 py-1 rounded-full flex-shrink-0">
              {stateIssues.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onCreateIssue(state.id)}
            className="text-ui-text-tertiary dark:text-ui-text-tertiary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark p-2.5 sm:p-3 flex-shrink-0"
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
            style={{
              animationDelay: `${columnIndex * (ANIMATION.STAGGER_DELAY * 2) + issueIndex * ANIMATION.STAGGER_DELAY}ms`,
            }}
          >
            <IssueCard
              issue={issue}
              onDragStart={(e) => onDragStart(e, issue._id)}
              onClick={() => !selectionMode && onIssueClick(issue._id)}
              selectionMode={selectionMode}
              isSelected={selectedIssueIds.has(issue._id)}
              onToggleSelect={onToggleSelect}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
