import type { Id } from "@convex/_generated/dataModel";
import { memo, useEffect, useRef } from "react";
import { getPriorityColor, getPriorityIcon, getTypeIcon, getTypeLabel } from "@/lib/issue-utils";
import { Tooltip } from "./ui/Tooltip";
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
  labels: { name: string; color: string }[];
  storyPoints?: number;
}

interface IssueCardProps {
  issue: Issue;
  onDragStart: (e: React.DragEvent, issueId: Id<"issues">) => void;
  onClick?: (issueId: Id<"issues">) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  isFocused?: boolean;
  onToggleSelect?: (issueId: Id<"issues">) => void;
  canEdit?: boolean;
}

export const IssueCard = memo(function IssueCard({
  issue,
  onDragStart,
  onClick,
  selectionMode = false,
  isSelected = false,
  isFocused = false,
  onToggleSelect,
  canEdit = true,
}: IssueCardProps) {
  const cardRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isFocused && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isFocused]);

  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (selectionMode && onToggleSelect) {
      e.stopPropagation();
      onToggleSelect(issue._id);
    } else if (onClick) {
      onClick(issue._id);
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
      ref={cardRef}
      type="button"
      draggable={canEdit && !selectionMode}
      onDragStart={canEdit && !selectionMode ? (e) => onDragStart(e, issue._id) : undefined}
      onClick={handleClick}
      className={`w-full text-left bg-ui-bg-primary dark:bg-ui-bg-primary-dark p-2 sm:p-3 rounded-lg border-2 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer ${
        isSelected
          ? "border-brand-600 dark:border-brand-600 bg-brand-50 dark:bg-brand-900/20"
          : isFocused
            ? "border-brand-400 dark:border-brand-500 ring-2 ring-brand-500/50"
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
              aria-label={`Select issue ${issue.key}`}
              checked={isSelected}
              onChange={handleCheckboxClick}
              onClick={handleCheckboxClick}
              className="w-4 h-4 text-brand-600 border-ui-border-primary rounded focus:ring-brand-500 cursor-pointer"
            />
          )}
          <Tooltip content={getTypeLabel(issue.type)}>
            <span role="img" aria-label={getTypeLabel(issue.type)} className="text-sm cursor-help">
              {getTypeIcon(issue.type)}
            </span>
          </Tooltip>
          <span className="text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark font-mono">
            {issue.key}
          </span>
        </div>
        <Tooltip
          content={`Priority: ${issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}`}
        >
          <div
            role="img"
            aria-label={`Priority: ${issue.priority}`}
            className={`text-xs ${getPriorityColor(issue.priority)} cursor-help`}
          >
            {getPriorityIcon(issue.priority)}
          </div>
        </Tooltip>
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
            <span
              key={label.name}
              className="px-1.5 py-0.5 text-xs font-medium rounded-md text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
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
            <Tooltip content={`Assigned to: ${issue.assignee.name}`}>
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
            </Tooltip>
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
