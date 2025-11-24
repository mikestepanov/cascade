/**
 * Digest Email Cron Actions
 *
 * Sends daily and weekly digest emails to users who have opted in
 */

import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";

/**
 * Send daily digest emails to all users who have opted in
 */
export const sendDailyDigests = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get all users who have daily digest enabled
    const users = await ctx.runQuery(internal.users.listWithDigestPreference, {
      frequency: "daily",
    });

    // Send digest to each user
    const results = await Promise.allSettled(
      users.map((user) =>
        ctx.runAction(internal.email.notifications.sendDigestEmail, {
          userId: user._id,
          frequency: "daily",
        }),
      ),
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return { sent: successful, failed };
  },
});

/**
 * Send weekly digest emails to all users who have opted in
 */
export const sendWeeklyDigests = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get all users who have weekly digest enabled
    const users = await ctx.runQuery(internal.users.listWithDigestPreference, {
      frequency: "weekly",
    });

    // Send digest to each user
    const results = await Promise.allSettled(
      users.map((user) =>
        ctx.runAction(internal.email.notifications.sendDigestEmail, {
          userId: user._id,
          frequency: "weekly",
        }),
      ),
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return { sent: successful, failed };
  },
});
