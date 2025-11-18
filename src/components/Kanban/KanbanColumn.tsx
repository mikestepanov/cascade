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
    <div
      className="flex-shrink-0 w-72 sm:w-80 bg-gray-50 dark:bg-gray-800 rounded-lg animate-slide-up"
      style={{ animationDelay: `${columnIndex * 100}ms` }}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, state.id)}
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
            onClick={() => onCreateIssue(state.id)}
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
