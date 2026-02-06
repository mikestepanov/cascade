import type { Id } from "@convex/_generated/dataModel";
import { GripVertical } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { Flex } from "@/components/ui/Flex";
import type { IssuePriority, IssueType } from "@/lib/issue-utils";
import { getPriorityColor, getPriorityIcon, getTypeIcon, getTypeLabel } from "@/lib/issue-utils";
import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";
import { Tooltip } from "./ui/Tooltip";
import { Typography } from "./ui/Typography";

interface Issue {
  _id: Id<"issues">;
  key: string;
  title: string;
  type: IssueType;
  priority: IssuePriority;
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
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isFocused && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isFocused]);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    onDragStart(e, issue._id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (selectionMode && onToggleSelect) {
      e.stopPropagation();
      onToggleSelect(issue._id);
    } else if (onClick) {
      onClick(issue._id);
    }
  };

  const handleCheckboxClick = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect(issue._id);
    }
  };

  return (
    <button
      ref={cardRef}
      type="button"
      data-testid={TEST_IDS.ISSUE.CARD}
      draggable={canEdit && !selectionMode}
      onDragStart={canEdit && !selectionMode ? handleDragStart : undefined}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className={cn(
        "group w-full text-left bg-ui-bg-soft p-2 sm:p-3 rounded-container cursor-pointer",
        "border transition-default",
        isDragging && "opacity-50 scale-95",
        isSelected
          ? "border-brand-indigo-border/60 bg-brand-indigo-track shadow-soft"
          : isFocused
            ? "border-ui-border-focus/50 ring-1 ring-ui-border-focus/20 bg-ui-bg-hover"
            : "border-ui-border hover:border-ui-border-secondary hover:bg-ui-bg-hover",
      )}
    >
      {/* Header */}
      <Flex align="start" justify="between" className="mb-2">
        <Flex align="center" className="space-x-2">
          {/* Drag handle - minimal, appears on hover */}
          {canEdit && !selectionMode && (
            <GripVertical
              className="w-3 h-3 text-ui-text-tertiary opacity-0 group-hover:opacity-40 transition-fast cursor-grab -ml-0.5 shrink-0"
              aria-hidden="true"
            />
          )}
          {/* Checkbox in selection mode */}
          {selectionMode && (
            <input
              type="checkbox"
              aria-label={`Select issue ${issue.key}`}
              checked={isSelected}
              onChange={handleCheckboxClick}
              onClick={handleCheckboxClick}
              className="w-4 h-4 text-brand border-ui-border rounded focus:ring-brand-ring cursor-pointer"
            />
          )}
          <Tooltip content={getTypeLabel(issue.type)}>
            <span role="img" aria-label={getTypeLabel(issue.type)} className="text-sm cursor-help">
              {getTypeIcon(issue.type)}
            </span>
          </Tooltip>
          <span
            data-testid={TEST_IDS.ISSUE.KEY}
            className="text-xs text-ui-text-secondary font-mono"
          >
            {issue.key}
          </span>
        </Flex>
        <Tooltip
          content={`Priority: ${issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}`}
        >
          <div
            role="img"
            data-testid={TEST_IDS.ISSUE.PRIORITY}
            aria-label={`Priority: ${issue.priority}`}
            className={cn("text-xs cursor-help", getPriorityColor(issue.priority))}
          >
            {getPriorityIcon(issue.priority)}
          </div>
        </Tooltip>
      </Flex>

      {/* Title */}
      <Typography
        variant="h4"
        className="text-xs sm:text-sm font-medium mb-2 line-clamp-2 border-none"
      >
        {issue.title}
      </Typography>

      {/* Labels */}
      {issue.labels.length > 0 && (
        <Flex wrap gap="xs" className="mb-2">
          {issue.labels.slice(0, 3).map((label) => (
            <Typography
              key={label.name}
              variant="small"
              className="px-1.5 py-0.5 font-medium rounded-md text-brand-foreground border-none"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </Typography>
          ))}
          {issue.labels.length > 3 && (
            <Tooltip
              content={issue.labels
                .slice(3)
                .map((l) => l.name)
                .join(", ")}
            >
              {/* biome-ignore lint/a11y/useSemanticElements: Nested buttons are invalid, using span with role="button" */}
              <span
                tabIndex={0}
                role="button"
                className="rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-ring"
              >
                <Typography
                  variant="small"
                  color="secondary"
                  className="px-1.5 py-0.5 border-none cursor-help"
                >
                  +{issue.labels.length - 3}
                </Typography>
              </span>
            </Tooltip>
          )}
        </Flex>
      )}

      {/* Footer */}
      <Flex
        direction="column"
        align="start"
        justify="between"
        gap="sm"
        className="sm:flex-row sm:items-center"
      >
        <Flex align="center" className="space-x-2">
          {issue.assignee && (
            <Tooltip content={`Assigned to: ${issue.assignee.name}`}>
              <Flex align="center" className="space-x-1">
                {issue.assignee.image ? (
                  <img
                    src={issue.assignee.image}
                    alt={issue.assignee.name}
                    className="w-5 h-5 rounded-full"
                  />
                ) : (
                  <Flex
                    align="center"
                    justify="center"
                    className="w-5 h-5 rounded-full bg-ui-bg-tertiary text-xs text-ui-text-secondary"
                  >
                    {issue.assignee.name.charAt(0).toUpperCase()}
                  </Flex>
                )}
              </Flex>
            </Tooltip>
          )}
        </Flex>
        {issue.storyPoints !== undefined && (
          <Flex align="center" className="space-x-1 text-xs text-ui-text-secondary">
            <span className="font-medium">{issue.storyPoints}</span>
            <span>pts</span>
          </Flex>
        )}
      </Flex>
    </button>
  );
});
