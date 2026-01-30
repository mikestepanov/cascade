import type { Doc, Id } from "@convex/_generated/dataModel";
import { memo } from "react";
import { Button } from "@/components/ui/Button";
import { Flex } from "@/components/ui/Flex";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";

export interface NotificationWithActor extends Doc<"notifications"> {
  actorName?: string;
}

interface NotificationItemProps {
  notification: NotificationWithActor;
  onMarkAsRead: (id: Id<"notifications">) => void;
  onDelete: (id: Id<"notifications">) => void;
}

/**
 * Returns the appropriate emoji icon based on the notification type.
 */
function getNotificationIcon(type: string): string {
  switch (type) {
    case "issue_assigned":
      return "👤";
    case "issue_mentioned":
      return "💬";
    case "issue_commented":
      return "💭";
    case "issue_status_changed":
      return "🔄";
    case "sprint_started":
      return "🚀";
    case "sprint_ended":
      return "🏁";
    default:
      return "📬";
  }
}

/**
 * Formats a timestamp into a relative time string (e.g., "5m ago") or date string.
 */
function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

/**
 * A memoized component that renders a single notification item.
 * Supports "Mark as read" and "Delete" actions.
 */
export const NotificationItem = memo(function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  return (
    <div
      className={cn(
        "p-4 hover:bg-ui-bg-secondary transition-colors",
        !notification.isRead && "bg-status-info-bg",
      )}
    >
      <Flex align="start" gap="md">
        {/* Icon */}
        <div className="text-2xl shrink-0">{getNotificationIcon(notification.type)}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Flex align="start" justify="between" gap="sm">
            <div className="flex-1">
              <Typography className="text-sm font-medium text-ui-text">
                {notification.title}
              </Typography>
              <Typography className="text-sm text-ui-text-secondary mt-1">
                {notification.message}
              </Typography>
              <Flex align="center" gap="sm" className="mt-1">
                <Typography className="text-xs text-ui-text-tertiary">
                  {formatTime(notification._creationTime)}
                </Typography>
                {notification.actorName && (
                  <>
                    <span className="text-xs text-ui-text-tertiary">•</span>
                    <Typography className="text-xs text-ui-text-tertiary">
                      by {notification.actorName}
                    </Typography>
                  </>
                )}
              </Flex>
            </div>

            <Flex gap="xs">
              {!notification.isRead && (
                <Tooltip content="Mark as read">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMarkAsRead(notification._id)}
                    className="h-6 w-6 p-0 text-brand hover:bg-brand-subtle hover:text-brand-hover"
                    aria-label="Mark as read"
                  >
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Button>
                </Tooltip>
              )}
              <Tooltip content="Delete">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(notification._id)}
                  className="h-6 w-6 p-0 text-ui-text-tertiary hover:text-status-error hover:bg-status-error-bg"
                  aria-label="Delete notification"
                >
                  <svg
                    aria-hidden="true"
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Button>
              </Tooltip>
            </Flex>
          </Flex>
        </div>
      </Flex>
    </div>
  );
});
