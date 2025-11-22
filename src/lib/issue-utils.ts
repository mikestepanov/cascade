/**
 * Issue utility functions for consistent handling of issue types, priorities, and statuses
 */

export type IssueType = "task" | "bug" | "story" | "epic" | "subtask";
export type IssuePriority = "lowest" | "low" | "medium" | "high" | "highest";

/**
 * Get the icon for an issue type
 */
export function getTypeIcon(type: string): string {
  switch (type) {
    case "bug":
      return "🐛";
    case "story":
      return "📖";
    case "epic":
      return "⚡";
    case "subtask":
      return "🔸";
    default:
      return "✓";
  }
}

/**
 * Get the color classes for an issue priority
 * Uses semantic theme tokens with full dark mode support
 * @param variant - The style variant: 'text', 'bg', or 'badge'
 */
export function getPriorityColor(
  priority: string,
  variant: "text" | "bg" | "badge" = "text",
): string {
  const colors = {
    highest: {
      text: "text-priority-highest",
      bg: "bg-status-error-bg dark:bg-status-error-bg-dark text-status-error-text dark:text-status-error-text-dark",
      badge: "text-priority-highest bg-status-error-bg dark:bg-status-error-bg-dark",
    },
    high: {
      text: "text-priority-high",
      bg: "bg-status-warning-bg dark:bg-status-warning-bg-dark text-status-warning-text dark:text-status-warning-text-dark",
      badge: "text-priority-high bg-status-warning-bg dark:bg-status-warning-bg-dark",
    },
    medium: {
      text: "text-priority-medium",
      bg: "bg-status-warning-bg dark:bg-status-warning-bg-dark text-status-warning-text dark:text-status-warning-text-dark",
      badge: "text-priority-medium bg-status-warning-bg dark:bg-status-warning-bg-dark",
    },
    low: {
      text: "text-priority-low",
      bg: "bg-status-info-bg dark:bg-status-info-bg-dark text-status-info-text dark:text-status-info-text-dark",
      badge: "text-priority-low bg-status-info-bg dark:bg-status-info-bg-dark",
    },
    lowest: {
      text: "text-priority-lowest",
      bg: "bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-ui-text-secondary dark:text-ui-text-secondary-dark",
      badge: "text-priority-lowest bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark",
    },
  };

  return colors[priority as keyof typeof colors]?.[variant] || colors.lowest[variant];
}

/**
 * Get the icon for an issue priority
 */
export function getPriorityIcon(priority: string): string {
  switch (priority) {
    case "highest":
      return "↑↑";
    case "high":
      return "↑";
    case "medium":
      return "→";
    case "low":
      return "↓";
    case "lowest":
      return "↓↓";
    default:
      return "→";
  }
}

/**
 * Get the emoji for a priority with text
 */
export function getPriorityEmoji(priority: string): string {
  switch (priority) {
    case "highest":
      return "⬆️";
    case "high":
      return "↗️";
    case "medium":
      return "➡️";
    case "low":
      return "↘️";
    case "lowest":
      return "⬇️";
    default:
      return "➡️";
  }
}

/**
 * Get the label for an issue type with emoji
 */
export function getTypeLabel(type: string): string {
  switch (type) {
    case "bug":
      return "🐛 Bug";
    case "story":
      return "📖 Story";
    case "epic":
      return "🎯 Epic";
    case "subtask":
      return "🔸 Sub-task";
    default:
      return "📋 Task";
  }
}

/**
 * Get the color for a sprint/workflow status
 * Uses semantic theme tokens with full dark mode support
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
    case "in progress":
      return "bg-status-success-bg dark:bg-status-success-bg-dark text-status-success-text dark:text-status-success-text-dark";
    case "completed":
    case "done":
      return "bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-ui-text-secondary dark:text-ui-text-secondary-dark";
    case "future":
    case "todo":
      return "bg-status-info-bg dark:bg-status-info-bg-dark text-status-info-text dark:text-status-info-text-dark";
    case "blocked":
      return "bg-status-error-bg dark:bg-status-error-bg-dark text-status-error-text dark:text-status-error-text-dark";
    default:
      return "bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-ui-text-secondary dark:text-ui-text-secondary-dark";
  }
}
