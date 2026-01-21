/**
 * Convex Server Logger
 *
 * Wrapper around console for server-side logging in Convex functions.
 * Logs appear in the Convex dashboard.
 *
 * Usage:
 *   import { logger } from "./lib/logger";
 *   logger.info("Processing request", { userId, action });
 *   logger.error("Failed to process", { error: e.message });
 */

type LogData = Record<string, unknown>;

function safeStringify(data: LogData): string {
  try {
    return JSON.stringify(data);
  } catch {
    // Handle circular references or other stringify errors
    return "[Unable to serialize data]";
  }
}

function formatMessage(prefix: string, message: string, data?: LogData): string {
  if (data && Object.keys(data).length > 0) {
    return `[${prefix}] ${message} ${safeStringify(data)}`;
  }
  return `[${prefix}] ${message}`;
}

export const logger = {
  /** Debug information (development only) */
  debug(message: string, data?: LogData): void {
    console.debug(formatMessage("DEBUG", message, data));
  },

  /** General information */
  info(message: string, data?: LogData): void {
    console.info(formatMessage("INFO", message, data));
  },

  /** Warning conditions */
  warn(message: string, data?: LogData): void {
    console.warn(formatMessage("WARN", message, data));
  },

  /** Error conditions */
  error(message: string, data?: LogData): void {
    console.error(formatMessage("ERROR", message, data));
  },
};
