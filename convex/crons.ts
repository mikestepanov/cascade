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
  (internal as any).email.digests.sendDailyDigests, // eslint-disable-line @typescript-eslint/no-explicit-any
);

/**
 * Send weekly digest emails
 * Runs every Monday at 9:00 AM UTC
 */
crons.weekly(
  "send weekly digests",
  { dayOfWeek: "monday", hourUTC: 9, minuteUTC: 0 },
  (internal as any).email.digests.sendWeeklyDigests, // eslint-disable-line @typescript-eslint/no-explicit-any
);

export default crons;
