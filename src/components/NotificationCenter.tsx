import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const notifications = useQuery(api.notifications.list, { limit: 20 });
  const unreadCount = useQuery(api.notifications.getUnreadCount, {});
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const removeNotification = useMutation(api.notifications.remove);

  const handleMarkAsRead = async (id: Id<"notifications">) => {
    await markAsRead({ id });
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead({});
  };

  const handleDelete = async (id: Id<"notifications">) => {
    await removeNotification({ id });
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
        return "📬";
    }
  };

  const formatTime = (timestamp: number) => {
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
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
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
        {unreadCount && unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-status-error rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setIsOpen(false)}
            aria-label="Close notifications"
          />

          {/* Dropdown Panel */}
          <div className="absolute right-0 mt-2 w-full sm:w-96 max-w-[calc(100vw-2rem)] bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg shadow-xl border border-ui-border-primary dark:border-ui-border-primary-dark z-20 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-ui-border-primary dark:border-ui-border-primary-dark flex items-center justify-between sticky top-0 bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-t-lg">
              <h3 className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
                Notifications
              </h3>
              {unreadCount && unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {!notifications || notifications.length === 0 ? (
                <div className="p-8 text-center text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  <div className="text-4xl mb-2">📭</div>
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-ui-border-primary dark:divide-ui-border-primary-dark">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark transition-colors ${
                        !notification.isRead ? "bg-brand-50 dark:bg-brand-900/20" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                                {notification.title}
                              </p>
                              <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                                  {formatTime(notification.createdAt)}
                                </p>
                                {notification.actorName && (
                                  <>
                                    <span className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                                      •
                                    </span>
                                    <p className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                                      by {notification.actorName}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-1">
                              {!notification.isRead && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkAsRead(notification._id)}
                                  className="p-1 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/30 rounded"
                                  title="Mark as read"
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
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDelete(notification._id)}
                                className="p-1 text-ui-text-tertiary dark:text-ui-text-tertiary-dark hover:text-status-error dark:hover:text-status-error hover:bg-status-error-bg dark:hover:bg-status-error-bg-dark rounded"
                                title="Delete"
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
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
