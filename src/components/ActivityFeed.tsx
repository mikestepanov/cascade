import { useQuery } from "convex/react";
import { formatRelativeTime } from "@/lib/dates";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { SkeletonList } from "./ui/Skeleton";

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
        return "text-green-600 dark:text-green-400";
      case "updated":
        return "text-blue-600 dark:text-blue-400";
      case "commented":
        return "text-purple-600 dark:text-purple-400";
      case "assigned":
        return "text-orange-600 dark:text-orange-400";
      case "linked":
      case "unlinked":
        return "text-indigo-600 dark:text-indigo-400";
      default:
        return "text-gray-600 dark:text-gray-400";
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
        <p>No activity yet</p>
        <p className="text-sm mt-1">Activity will appear here as work progresses</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div
          key={`${activity._id}-${index}`}
          className={`flex gap-4 ${
            compact
              ? "py-2"
              : "p-4 bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg border border-ui-border-primary dark:border-ui-border-primary-dark"
          }`}
        >
          {/* Timeline dot */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className={`text-2xl ${compact ? "text-lg" : ""}`}>
              {getActionIcon(activity.action)}
            </div>
            {!compact && index < activities.length - 1 && (
              <div className="w-0.5 flex-1 bg-ui-border-primary dark:bg-ui-border-primary-dark mt-2" />
            )}
          </div>

          {/* Activity content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p
                  className={`${compact ? "text-sm" : "text-base"} text-ui-text-primary dark:text-ui-text-primary-dark`}
                >
                  <span className="font-medium">{activity.userName}</span>{" "}
                  <span className={getActionColor(activity.action)}>
                    {formatActivityMessage(activity)}
                  </span>
                  {activity.issueKey && (
                    <span className="ml-1">
                      <span className="font-mono text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                        {activity.issueKey}
                      </span>
                    </span>
                  )}
                </p>
                {!compact && activity.field && activity.newValue && (
                  <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mt-1 truncate">
                    {activity.field}: {activity.newValue}
                  </p>
                )}
              </div>
              <span
                className={`${compact ? "text-xs" : "text-sm"} text-ui-text-tertiary dark:text-ui-text-tertiary-dark flex-shrink-0`}
              >
                {formatRelativeTime(activity.createdAt)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
