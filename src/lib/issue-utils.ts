/**
 * Issue utility functions for consistent handling of issue types, priorities, and statuses
 */

export type IssueType = "task" | "bug" | "story" | "epic";
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
    default:
      return "✓";
  }
}

/**
 * Get the color classes for an issue priority
 * @param variant - The style variant: 'text', 'bg', or 'badge'
 */
export function getPriorityColor(
  priority: string,
  variant: "text" | "bg" | "badge" = "text",
): string {
  const colors = {
    highest: {
      text: "text-red-600",
      bg: "bg-red-100 text-red-800",
      badge: "text-red-600 bg-red-50",
    },
    high: {
      text: "text-orange-600",
      bg: "bg-orange-100 text-orange-800",
      badge: "text-orange-600 bg-orange-50",
    },
    medium: {
      text: "text-yellow-600",
      bg: "bg-yellow-100 text-yellow-800",
      badge: "text-yellow-600 bg-yellow-50",
    },
    low: {
      text: "text-blue-600",
      bg: "bg-blue-100 text-blue-800",
      badge: "text-blue-600 bg-blue-50",
    },
    lowest: {
      text: "text-gray-600",
      bg: "bg-gray-100 text-gray-800",
      badge: "text-gray-600 bg-gray-50",
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
    default:
      return "📋 Task";
  }
}

/**
 * Get the color for a sprint/workflow status
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
    case "in progress":
      return "bg-green-100 text-green-800";
    case "completed":
    case "done":
      return "bg-gray-100 text-gray-800";
    case "future":
    case "todo":
      return "bg-blue-100 text-blue-800";
    case "blocked":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
