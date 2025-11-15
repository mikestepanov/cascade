import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

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

  const formatActivityMessage = (activity: {
    action: string;
    field?: string;
    oldValue?: string;
    newValue?: string;
    issueKey?: string;
  }) => {
    const { action, field, oldValue, newValue, issueKey: _issueKey } = activity;

    if (action === "created") {
      return "created";
    } else if (action === "commented") {
      return "commented on";
    } else if (action === "started_watching") {
      return "started watching";
    } else if (action === "stopped_watching") {
      return "stopped watching";
    } else if (action === "linked") {
      return `linked ${field}`;
    } else if (action === "unlinked") {
      return `unlinked ${field}`;
    } else if (action === "updated" && field) {
      if (field === "status") {
        return `changed status from ${oldValue} to ${newValue}`;
      } else if (field === "priority") {
        return `changed priority from ${oldValue} to ${newValue}`;
      } else if (field === "assignee") {
        return oldValue && newValue
          ? `reassigned from ${oldValue} to ${newValue}`
          : newValue
            ? `assigned to ${newValue}`
            : "unassigned";
      } else {
        return `updated ${field}`;
      }
    } else {
      return action;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

    return date.toLocaleDateString();
  };

  if (!activities) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <svg
          aria-hidden="true"
          className="w-16 h-16 mx-auto mb-4 text-gray-400"
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
              : "p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          }`}
        >
          {/* Timeline dot */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className={`text-2xl ${compact ? "text-lg" : ""}`}>
              {getActionIcon(activity.action)}
            </div>
            {!compact && index < activities.length - 1 && (
              <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 mt-2" />
            )}
          </div>

          {/* Activity content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p
                  className={`${compact ? "text-sm" : "text-base"} text-gray-900 dark:text-gray-100`}
                >
                  <span className="font-medium">{activity.userName}</span>{" "}
                  <span className={getActionColor(activity.action)}>
                    {formatActivityMessage(activity)}
                  </span>
                  {activity.issueKey && (
                    <span className="ml-1">
                      <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                        {activity.issueKey}
                      </span>
                    </span>
                  )}
                </p>
                {!compact && activity.field && activity.newValue && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                    {activity.field}: {activity.newValue}
                  </p>
                )}
              </div>
              <span
                className={`${compact ? "text-xs" : "text-sm"} text-gray-500 dark:text-gray-400 flex-shrink-0`}
              >
                {formatTimestamp(activity.timestamp)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
