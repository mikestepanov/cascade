/**
 * Email Notification Helpers
 *
 * Helper functions to trigger email notifications from mutations
 */

import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";

/**
 * Send email notification after creating in-app notification
 *
 * This checks user preferences and sends email if enabled.
 * Call this after creating an in-app notification.
 */
export async function sendEmailNotification(
  ctx: MutationCtx,
  params: {
    userId: Id<"users">;
    type: "mention" | "assigned" | "comment" | "status_change";
    issueId: Id<"issues">;
    actorId?: Id<"users">;
    commentText?: string;
  },
) {
  const { userId, type, issueId, actorId, commentText } = params;

  // Check if user wants email for this notification type
  const shouldSend = await ctx.runMutation(internal.notificationPreferences.shouldSendEmail, {
    userId,
    type,
  });

  if (!shouldSend) {
    return; // User has disabled this notification type
  }

  // Get user email
  const user = await ctx.db.get(userId);
  if (!user || !("email" in user) || !user.email) {
    console.warn("User has no email address:", userId);
    return;
  }

  // Get actor name
  let actorName = "Someone";
  if (actorId) {
    const actor = await ctx.db.get(actorId);
    if (actor && "name" in actor) {
      actorName = actor.name || actorName;
    }
  }

  // Get issue details
  const issue = await ctx.db.get(issueId);
  if (!issue) {
    console.warn("Issue not found:", issueId);
    return;
  }

  // Get project details
  const project = await ctx.db.get(issue.projectId);
  if (!project) {
    console.warn("Project not found:", issue.projectId);
    return;
  }

  // Schedule email to be sent (using action)
  await ctx.scheduler.runAfter(0, internal.email.notifications.sendNotificationEmail, {
    to: user.email as string,
    type,
    actorName,
    issueId: issue._id,
    issueKey: issue.key,
    issueTitle: issue.title,
    issueType: issue.type,
    issuePriority: issue.priority,
    projectName: project.name,
    dueDate: issue.dueDate,
    commentText,
  });
}
