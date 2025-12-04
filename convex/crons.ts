/**
 * Scheduled Cron Jobs
 *
 * Handles automated tasks like sending digest emails
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Send daily digest emails
 * Runs every day at 9:00 AM UTC
 */
crons.daily(
  "send daily digests",
  { hourUTC: 9, minuteUTC: 0 },
  internal.email.digests.sendDailyDigests,
);

/**
 * Send weekly digest emails
 * Runs every Monday at 9:00 AM UTC
 */
crons.weekly(
  "send weekly digests",
  { dayOfWeek: "monday", hourUTC: 9, minuteUTC: 0 },
  internal.email.digests.sendWeeklyDigests,
);

/**
 * Cleanup old test users (E2E testing)
 * Runs every hour to delete test users older than 1 hour
 * Only affects users with isTestUser=true flag
 */
crons.interval("cleanup test users", { hours: 1 }, internal.e2e.cleanupTestUsersInternal);

export default crons;
