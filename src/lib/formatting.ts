/**
 * Shared formatting utilities for the application
 * Centralizes all formatting logic to ensure consistency
 */

/**
 * Format duration in seconds to HH:MM:SS format
 * @param seconds - Duration in seconds
 * @returns Formatted string like "02:30:45"
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format duration in milliseconds to HH:MM:SS format
 * @param ms - Duration in milliseconds
 * @returns Formatted string like "02:30:45"
 */
export function formatDurationMs(ms: number): string {
  return formatDuration(Math.floor(ms / 1000));
}

/**
 * Format duration in seconds to hours (decimal format)
 * @param seconds - Duration in seconds
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted hours like "2.50"
 */
export function formatHours(seconds: number, decimals: number = 2): string {
  return (seconds / 3600).toFixed(decimals);
}

/**
 * Format timestamp to readable date string
 * @param timestamp - Unix timestamp in milliseconds
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date like "Jan 15, 2025"
 */
export function formatDate(
  timestamp: number,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  },
): string {
  return new Date(timestamp).toLocaleDateString("en-US", options);
}

/**
 * Format timestamp to time string
 * @param timestamp - Unix timestamp in milliseconds
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted time like "2:30 PM"
 */
export function formatTime(
  timestamp: number,
  options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  },
): string {
  return new Date(timestamp).toLocaleTimeString("en-US", options);
}

/**
 * Format timestamp to date and time string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted string like "Jan 15, 2025 at 2:30 PM"
 */
export function formatDateTime(timestamp: number): string {
  return `${formatDate(timestamp)} at ${formatTime(timestamp)}`;
}

/**
 * Format currency amount
 * @param amount - Amount to format
 * @param currency - Currency code (default: "USD")
 * @returns Formatted currency like "$1,234.56"
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(amount || 0);
}

/**
 * Format date as ISO string for input[type="date"]
 * @param timestamp - Unix timestamp in milliseconds
 * @returns ISO date string like "2025-01-15"
 */
export function formatDateForInput(timestamp: number): string {
  return new Date(timestamp).toISOString().split("T")[0];
}

/**
 * Format time as HH:MM for input[type="time"]
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Time string like "14:30"
 */
export function formatTimeForInput(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Relative time string
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = timestamp - now;
  const absDiff = Math.abs(diff);

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (years > 0) return formatter.format(diff > 0 ? years : -years, "year");
  if (months > 0) return formatter.format(diff > 0 ? months : -months, "month");
  if (days > 0) return formatter.format(diff > 0 ? days : -days, "day");
  if (hours > 0) return formatter.format(diff > 0 ? hours : -hours, "hour");
  if (minutes > 0) return formatter.format(diff > 0 ? minutes : -minutes, "minute");
  return formatter.format(diff > 0 ? seconds : -seconds, "second");
}

/**
 * Format file size in bytes to human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted size like "1.5 MB"
 */
export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Format number with thousands separator
 * @param num - Number to format
 * @returns Formatted number like "1,234,567"
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}
