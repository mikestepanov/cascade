import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const notifications = useQuery(api.notifications.list, { limit: 20 });
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const removeNotification = useMutation(api.notifications.remove);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleNotificationClick = async (
    notificationId: Id<"notifications">,
    issueId?: Id<"issues">,
  ) => {
    await markAsRead({ id: notificationId });
    setIsOpen(false);

    // Could navigate to the issue/document here if needed
    if (issueId) {
      // Navigation logic would go here
    }
  };

  const getNotificationIcon = (type: string) => {
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
        return "🔔";
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle notifications"
        className="relative p-2 text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark rounded-lg transition-colors"
      >
        <svg
          aria-hidden="true"
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount !== undefined && unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-status-error rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg shadow-xl border border-ui-border-primary dark:border-ui-border-primary-dark z-50 max-h-[32rem] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-ui-border-primary dark:border-ui-border-primary-dark flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
              Notifications
            </h3>
            {notifications && notifications.length > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {!notifications ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="text-6xl mb-4">🔔</div>
                <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark text-center">
                  No notifications yet
                </p>
                <p className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark text-center mt-1">
                  We'll notify you when something happens
                </p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <button
                    key={notification._id}
                    type="button"
                    className={`w-full text-left px-4 py-3 hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark cursor-pointer border-b border-ui-border-primary dark:border-ui-border-primary-dark transition-colors ${
                      !notification.isRead ? "bg-brand-50 dark:bg-brand-900/20" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification._id, notification.issueId)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                          {notification.title}
                        </p>
                        <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                            {formatTime(notification.createdAt)}
                          </span>
                          {notification.actorName && (
                            <>
                              <span className="text-xs text-ui-text-tertiary">•</span>
                              <span className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                                by {notification.actorName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification({ id: notification._id });
                        }}
                        aria-label="Remove notification"
                        className="flex-shrink-0 text-ui-text-tertiary hover:text-ui-text-secondary dark:hover:text-ui-text-secondary-dark"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
