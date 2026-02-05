import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { formatRelativeTime } from "@/lib/dates";
import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";
import { EmptyState } from "./ui/EmptyState";
import { Flex } from "./ui/Flex";
import { SkeletonList } from "./ui/Skeleton";
import { Typography, type TypographyProps } from "./ui/Typography";

interface Activity {
  _id: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  issueKey?: string;
  userName: string;
  _creationTime: number;
}

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

  const getActionColor = (action: string): TypographyProps["color"] => {
    switch (action) {
      case "created":
        return "success";
      case "updated":
        return "primary";
      case "commented":
        return "accent";
      case "assigned":
        return "warning";
      case "linked":
      case "unlinked":
        return "primary";
      default:
        return "secondary";
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
      <EmptyState
        icon="🕐"
        title="No activity yet"
        description="Activity will appear here as work progresses"
      />
    );
  }

  return (
    <Flex direction="column" gap="lg" data-testid={TEST_IDS.ACTIVITY.FEED}>
      {activities.map((activity: Activity, index: number) => (
        <Flex
          key={`${activity._id}-${index}`}
          gap="lg"
          className={compact ? "py-2" : "p-4 bg-ui-bg rounded-lg border border-ui-border"}
          data-testid={TEST_IDS.ACTIVITY.ENTRY}
        >
          {/* Timeline dot */}
          <Flex direction="column" align="center" className="shrink-0">
            <div className={cn("text-2xl", compact && "text-lg")}>
              {getActionIcon(activity.action)}
            </div>
            {!compact && index < activities.length - 1 && (
              <div className="w-0.5 flex-1 bg-ui-border mt-2" />
            )}
          </Flex>

          {/* Activity content */}
          <div className="flex-1 min-w-0">
            <Flex align="start" justify="between" gap="sm">
              <div className="flex-1 min-w-0">
                <Typography
                  variant="p"
                  className={cn(compact ? "text-sm" : "text-base", "mb-0 mt-0")}
                >
                  <Typography as="span" className="font-medium">
                    {activity.userName}
                  </Typography>{" "}
                  <Typography as="span" color={getActionColor(activity.action)}>
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
                className={cn(compact ? "text-xs" : "text-sm", "flex-shrink-0")}
              >
                {formatRelativeTime(activity._creationTime)}
              </Typography>
            </Flex>
          </div>
        </Flex>
      ))}
    </Flex>
  );
}
