/**
 * Time Utilities for Convex Queries
 *
 * IMPORTANT: Avoid using Date.now() directly in queries!
 * It breaks Convex's reactive subscription system and query caching.
 *
 * Instead:
 * 1. Pass timestamps as query arguments from the client
 * 2. Use rounded timestamps to improve cache hit rates
 * 3. Use these utilities to calculate thresholds
 *
 * @see https://docs.convex.dev/understanding/best-practices/other-recommendations
 */

// =============================================================================
// Time Constants (milliseconds)
// =============================================================================

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;
export const MONTH = 30 * DAY; // Approximate

// =============================================================================
// Rounding Utilities
// =============================================================================

/**
 * Round a timestamp down to the nearest interval.
 * Use this to improve query cache hit rates.
 *
 * @param timestamp - The timestamp to round (defaults to current time in mutations)
 * @param interval - The interval to round to (e.g., MINUTE, HOUR)
 * @returns Rounded timestamp
 *
 * @example
 * // In a mutation (Date.now() is OK in mutations)
 * const roundedNow = roundToInterval(Date.now(), HOUR);
 *
 * // Client-side, pass to query
 * const since = roundToInterval(Date.now(), MINUTE);
 * useQuery(api.dashboard.getMyStats, { since });
 */
export function roundToInterval(timestamp: number, interval: number): number {
  return Math.floor(timestamp / interval) * interval;
}

/**
 * Round to the nearest minute (good default for most queries).
 */
export function roundToMinute(timestamp: number): number {
  return roundToInterval(timestamp, MINUTE);
}

/**
 * Round to the nearest hour (for less time-sensitive queries).
 */
export function roundToHour(timestamp: number): number {
  return roundToInterval(timestamp, HOUR);
}

/**
 * Round to the start of the day (midnight UTC).
 */
export function roundToDay(timestamp: number): number {
  return roundToInterval(timestamp, DAY);
}

// =============================================================================
// Threshold Calculators
// =============================================================================

/**
 * Calculate a "since" threshold for time-based filtering.
 * Use with a timestamp passed from the client.
 *
 * @param now - Current timestamp (passed from client, rounded)
 * @param interval - How far back to look
 * @returns Threshold timestamp
 *
 * @example
 * // Query handler
 * handler: async (ctx, args) => {
 *   const weekAgo = getThreshold(args.now, WEEK);
 *   // Filter issues updated after weekAgo
 * }
 */
export function getThreshold(now: number, interval: number): number {
  return now - interval;
}

/**
 * Calculate "since" threshold for common intervals.
 * Convenience functions for readability.
 */
export const thresholds = {
  lastHour: (now: number) => getThreshold(now, HOUR),
  lastDay: (now: number) => getThreshold(now, DAY),
  lastWeek: (now: number) => getThreshold(now, WEEK),
  lastMonth: (now: number) => getThreshold(now, MONTH),
  last7Days: (now: number) => getThreshold(now, 7 * DAY),
  last14Days: (now: number) => getThreshold(now, 14 * DAY),
  last30Days: (now: number) => getThreshold(now, 30 * DAY),
  last90Days: (now: number) => getThreshold(now, 90 * DAY),
};

// =============================================================================
// Future Time Calculators
// =============================================================================

/**
 * Calculate a future timestamp.
 *
 * @param now - Current timestamp (passed from client, rounded)
 * @param interval - How far ahead to look
 * @returns Future timestamp
 */
export function getFutureTime(now: number, interval: number): number {
  return now + interval;
}

/**
 * Calculate future timestamps for common intervals.
 */
export const future = {
  nextHour: (now: number) => getFutureTime(now, HOUR),
  nextDay: (now: number) => getFutureTime(now, DAY),
  nextWeek: (now: number) => getFutureTime(now, WEEK),
  next7Days: (now: number) => getFutureTime(now, 7 * DAY),
  next30Days: (now: number) => getFutureTime(now, 30 * DAY),
  next90Days: (now: number) => getFutureTime(now, 90 * DAY),
};

// =============================================================================
// Validators for Query Args
// =============================================================================

import { v } from "convex/values";

/**
 * Validator for required "now" timestamp argument.
 * Queries MUST accept this and use it instead of Date.now().
 * Clients should pass a rounded timestamp for better caching.
 */
export const nowArg = v.number();

/**
 * Validator for time range arguments.
 */
export const timeRangeArgs = {
  from: v.optional(v.number()),
  to: v.optional(v.number()),
};
