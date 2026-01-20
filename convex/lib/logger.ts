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

/**
 * Constructs a single-line log message with a level prefix and optional serialized data.
 *
 * @param prefix - The log level label to include in brackets (e.g., "INFO", "ERROR")
 * @param message - The main log text to appear after the prefix
 * @param data - Optional object whose own enumerable keys, when present, are appended as JSON
 * @returns A string in the form `[PREFIX] message` or `[PREFIX] message <json>` when `data` has keys
 */
function formatMessage(prefix: string, message: string, data?: LogData): string {
  if (data && Object.keys(data).length > 0) {
    return `[${prefix}] ${message} ${JSON.stringify(data)}`;
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