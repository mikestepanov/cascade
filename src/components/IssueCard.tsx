import { memo } from "react";
import { getPriorityColor, getPriorityIcon, getTypeIcon } from "@/lib/issue-utils";
import type { Id } from "../../convex/_generated/dataModel";

interface Issue {
  _id: Id<"issues">;
  key: string;
  title: string;
  type: "task" | "bug" | "story" | "epic";
  priority: "lowest" | "low" | "medium" | "high" | "highest";
  assignee?: {
    _id: Id<"users">;
    name: string;
    image?: string;
  } | null;
  labels: string[];
  storyPoints?: number;
}

interface IssueCardProps {
  issue: Issue;
  onDragStart: (e: React.DragEvent) => void;
  onClick?: () => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (issueId: Id<"issues">) => void;
}

export const IssueCard = memo(function IssueCard({
  issue,
  onDragStart,
  onClick,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: IssueCardProps) {
  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (selectionMode && onToggleSelect) {
      e.stopPropagation();
      onToggleSelect(issue._id);
    } else if (onClick) {
      onClick();
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect(issue._id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={!selectionMode}
      onDragStart={selectionMode ? undefined : onDragStart}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick(e);
        }
      }}
      className={`bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-lg border-2 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer ${
        isSelected ? "border-primary bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600" : "border-gray-200 dark:border-gray-700"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          {/* Checkbox in selection mode */}
          {selectionMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxClick}
              onClick={handleCheckboxClick}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
            />
          )}
          <span className="text-sm">{getTypeIcon(issue.type)}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{issue.key}</span>
        </div>
        <div className={`text-xs ${getPriorityColor(issue.priority)}`}>
          {getPriorityIcon(issue.priority)}
        </div>
      </div>

      {/* Title */}
      <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">{issue.title}</h4>

      {/* Labels */}
      {issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {issue.labels.slice(0, 3).map((label) => (
            <span
              key={label}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            >
              {label}
            </span>
          ))}
          {issue.labels.length > 3 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">+{issue.labels.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          {issue.assignee && (
            <div className="flex items-center space-x-1">
              {issue.assignee.image ? (
                <img
                  src={issue.assignee.image}
                  alt={issue.assignee.name}
                  className="w-5 h-5 rounded-full"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300">
                  {issue.assignee.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}
        </div>
        {issue.storyPoints !== undefined && (
          <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium">{issue.storyPoints}</span>
            <span>pts</span>
          </div>
        )}
      </div>
    </div>
  );
});
