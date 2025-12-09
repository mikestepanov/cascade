import { memo } from "react";
import { getPriorityColor, getPriorityIcon, getTypeIcon } from "@/lib/issue-utils";
import type { Id } from "../../convex/_generated/dataModel";
import { Badge } from "./ui/Badge";
import { Typography } from "./ui/Typography";

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
  canEdit?: boolean;
}

export const IssueCard = memo(function IssueCard({
  issue,
  onDragStart,
  onClick,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
  canEdit = true,
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
    <button
      type="button"
      draggable={canEdit && !selectionMode}
      onDragStart={canEdit && !selectionMode ? onDragStart : undefined}
      onClick={handleClick}
      className={`w-full text-left bg-ui-bg-primary dark:bg-ui-bg-primary-dark p-2 sm:p-3 rounded-lg border-2 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer ${
        isSelected
          ? "border-brand-600 dark:border-brand-600 bg-brand-50 dark:bg-brand-900/20"
          : "border-ui-border-primary dark:border-ui-border-primary-dark"
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
              className="w-4 h-4 text-brand-600 border-ui-border-primary rounded focus:ring-brand-500 cursor-pointer"
            />
          )}
          <span className="text-sm">{getTypeIcon(issue.type)}</span>
          <span className="text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark font-mono">
            {issue.key}
          </span>
        </div>
        <div className={`text-xs ${getPriorityColor(issue.priority)}`}>
          {getPriorityIcon(issue.priority)}
        </div>
      </div>

      {/* Title */}
      <Typography
        variant="h4"
        className="text-xs sm:text-sm font-medium mb-2 line-clamp-2 border-none"
      >
        {issue.title}
      </Typography>

      {/* Labels */}
      {issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {issue.labels.slice(0, 3).map((label) => (
            <Badge key={label} variant="neutral">
              {label}
            </Badge>
          ))}
          {issue.labels.length > 3 && (
            <span className="text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark">
              +{issue.labels.length - 3}
            </span>
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
                <div className="w-5 h-5 rounded-full bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark flex items-center justify-center text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  {issue.assignee.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}
        </div>
        {issue.storyPoints !== undefined && (
          <div className="flex items-center space-x-1 text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark">
            <span className="font-medium">{issue.storyPoints}</span>
            <span>pts</span>
          </div>
        )}
      </div>
    </button>
  );
});
