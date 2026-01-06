import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { formatRelativeTime } from "@/lib/dates";
import { Flex } from "./ui/Flex";
import { SkeletonList } from "./ui/Skeleton";
import { Typography } from "./ui/Typography";

interface ActivityFeedProps {
  projectId: Id<"projects">;
  limit?: number;
  compact?: boolean;
}

export function ActivityFeed({ projectId, limit = 50, compact = false }: ActivityFeedProps) {
  const activities = useQuery(api.analytics.getRecentActivity, { projectId, limit });

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return "✨";
      case "updated":
        return "✏️";
      case "commented":
        return "💬";
      case "assigned":
        return "👤";
      case "linked":
        return "🔗";
      case "unlinked":
        return "⚠️";
      case "started_watching":
        return "👀";
      case "stopped_watching":
        return "🚫";
      default:
        return "📝";
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "created":
        return "text-status-success";
      case "updated":
        return "text-brand-600 dark:text-brand-400";
      case "commented":
        return "text-accent-600 dark:text-accent-400";
      case "assigned":
        return "text-status-warning";
      case "linked":
      case "unlinked":
        return "text-brand-500 dark:text-brand-300";
      default:
        return "text-ui-text-secondary dark:text-ui-text-secondary-dark";
    }
  };

  const formatUpdateMessage = (
    field: string,
    oldValue: string | undefined,
    newValue: string | undefined,
  ): string => {
    if (field === "status") {
      return `changed status from ${oldValue} to ${newValue}`;
    }
    if (field === "priority") {
      return `changed priority from ${oldValue} to ${newValue}`;
    }
    if (field === "assignee") {
      if (oldValue && newValue) {
        return `reassigned from ${oldValue} to ${newValue}`;
      }
      if (newValue) {
        return `assigned to ${newValue}`;
      }
      return "unassigned";
    }
    return `updated ${field}`;
  };

  const formatActivityMessage = (activity: {
    action: string;
    field?: string;
    oldValue?: string;
    newValue?: string;
    issueKey?: string;
  }) => {
    const { action, field, oldValue, newValue } = activity;

    // Handle simple action messages
    const simpleActions: Record<string, string> = {
      created: "created",
      commented: "commented on",
      started_watching: "started watching",
      stopped_watching: "stopped watching",
    };

    if (simpleActions[action]) {
      return simpleActions[action];
    }

    // Handle linked/unlinked actions
    if (action === "linked") {
      return `linked ${field}`;
    }
    if (action === "unlinked") {
      return `unlinked ${field}`;
    }

    // Handle updated actions with field-specific formatting
    if (action === "updated" && field) {
      return formatUpdateMessage(field, oldValue, newValue);
    }

    // Default fallback
    return action;
  };

  if (!activities) {
    return <SkeletonList items={5} />;
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-ui-text-secondary dark:text-ui-text-secondary-dark">
        <svg
          aria-hidden="true"
          className="w-16 h-16 mx-auto mb-4 text-ui-text-tertiary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <Typography variant="p" className="mb-0">
          No activity yet
        </Typography>
        <Typography variant="muted" className="mt-1">
          Activity will appear here as work progresses
        </Typography>
      </div>
    );
  }

  return (
    <Flex direction="column" gap="lg">
      {activities.map((activity, index) => (
        <Flex
          key={`${activity._id}-${index}`}
          gap="lg"
          className={
            compact
              ? "py-2"
              : "p-4 bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg border border-ui-border-primary dark:border-ui-border-primary-dark"
          }
        >
          {/* Timeline dot */}
          <Flex direction="column" align="center" className="flex-shrink-0">
            <div className={`text-2xl ${compact ? "text-lg" : ""}`}>
              {getActionIcon(activity.action)}
            </div>
            {!compact && index < activities.length - 1 && (
              <div className="w-0.5 flex-1 bg-ui-border-primary dark:bg-ui-border-primary-dark mt-2" />
            )}
          </Flex>

          {/* Activity content */}
          <div className="flex-1 min-w-0">
            <Flex align="start" justify="between" gap="sm">
              <div className="flex-1 min-w-0">
                <Typography
                  variant="p"
                  className={`${compact ? "text-sm" : "text-base"} mb-0 mt-0`}
                >
                  <Typography as="span" className="font-medium">
                    {activity.userName}
                  </Typography>{" "}
                  <Typography as="span" className={getActionColor(activity.action)}>
                    {formatActivityMessage(activity)}
                  </Typography>
                  {activity.issueKey && (
                    <Typography as="span" className="ml-1">
                      <Typography as="span" className="font-mono text-sm" color="secondary">
                        {activity.issueKey}
                      </Typography>
                    </Typography>
                  )}
                </Typography>
                {!compact && activity.field && activity.newValue && (
                  <Typography variant="muted" className="mt-1 truncate" color="secondary">
                    {activity.field}: {activity.newValue}
                  </Typography>
                )}
              </div>
              <Typography
                variant="muted"
                className={`${compact ? "text-xs" : "text-sm"} flex-shrink-0`}
              >
                {formatRelativeTime(activity.createdAt)}
              </Typography>
            </Flex>
          </div>
        </Flex>
      ))}
    </Flex>
  );
}
