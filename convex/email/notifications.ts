/**
 * Email Notification Functions
 *
 * Sends notification emails for various events (mentions, assignments, comments)
 */

import { render } from "@react-email/render";
import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { sendEmail } from "./index";
import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";

/**
 * Send a mention notification email
 */
export const sendMentionEmail = internalAction({
  args: {
    to: v.string(),
    mentionedByName: v.string(),
    issueKey: v.string(),
    issueTitle: v.string(),
    issueId: v.id("issues"),
    commentText: v.optional(v.string()),
    projectName: v.string(),
  },
  handler: async (ctx, args) => {
    const { to, mentionedByName, issueKey, issueTitle, commentText, projectName, issueId } = args;

    // Generate issue URL (you'll need to configure your app URL)
    const appUrl = process.env.APP_URL || "http://localhost:5173";
    const issueUrl = `${appUrl}/issues/${issueId}`;

    // Import the email template dynamically
    const { MentionEmail } = await import("../../emails/MentionEmail");

    // Render email to HTML
    const html = await render(
      MentionEmail({
        mentionedByName,
        issueKey,
        issueTitle,
        commentText,
        issueUrl,
        projectName,
      }),
    );

    // Send email
    const result = await sendEmail({
      to,
      subject: `${mentionedByName} mentioned you in ${issueKey}`,
      html,
      text: `${mentionedByName} mentioned you in ${issueKey}: ${issueTitle}\n\nView: ${issueUrl}`,
    });

    if (!result.success) {
      console.error("Failed to send mention email:", result.error);
    }

    return result;
  },
});

/**
 * Send an assignment notification email
 */
export const sendAssignmentEmail = internalAction({
  args: {
    to: v.string(),
    assignedByName: v.string(),
    issueKey: v.string(),
    issueTitle: v.string(),
    issueId: v.id("issues"),
    issueType: v.string(),
    issuePriority: v.string(),
    projectName: v.string(),
    dueDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const {
      to,
      assignedByName,
      issueKey,
      issueTitle,
      issueId,
      issueType,
      issuePriority,
      projectName,
      dueDate,
    } = args;

    const appUrl = process.env.APP_URL || "http://localhost:5173";
    const issueUrl = `${appUrl}/issues/${issueId}`;

    const { AssignmentEmail } = await import("../../emails/AssignmentEmail");

    const html = await render(
      AssignmentEmail({
        assignedByName,
        issueKey,
        issueTitle,
        issueType,
        issuePriority,
        issueUrl,
        projectName,
        dueDate,
      }),
    );

    const result = await sendEmail({
      to,
      subject: `You were assigned to ${issueKey}: ${issueTitle}`,
      html,
      text: `${assignedByName} assigned you to ${issueKey}: ${issueTitle}\n\nView: ${issueUrl}`,
    });

    if (!result.success) {
      console.error("Failed to send assignment email:", result.error);
    }

    return result;
  },
});

/**
 * Send a comment notification email
 */
export const sendCommentEmail = internalAction({
  args: {
    to: v.string(),
    commenterName: v.string(),
    issueKey: v.string(),
    issueTitle: v.string(),
    issueId: v.id("issues"),
    commentText: v.string(),
    projectName: v.string(),
  },
  handler: async (ctx, args) => {
    const { to, commenterName, issueKey, issueTitle, issueId, commentText, projectName } = args;

    const appUrl = process.env.APP_URL || "http://localhost:5173";
    const issueUrl = `${appUrl}/issues/${issueId}`;

    const { CommentEmail } = await import("../../emails/CommentEmail");

    const html = await render(
      CommentEmail({
        commenterName,
        issueKey,
        issueTitle,
        commentText,
        issueUrl,
        projectName,
      }),
    );

    const result = await sendEmail({
      to,
      subject: `${commenterName} commented on ${issueKey}`,
      html,
      text: `${commenterName} commented on ${issueKey}: ${issueTitle}\n\n"${commentText}"\n\nView: ${issueUrl}`,
    });

    if (!result.success) {
      console.error("Failed to send comment email:", result.error);
    }

    return result;
  },
});

/**
 * Helper to send notification email based on type
 *
 * This is called from the notifications system after checking user preferences.
 * All data is passed in to avoid needing to query from an action.
 */
export const sendNotificationEmail = internalAction({
  args: {
    to: v.string(), // User email
    type: v.string(), // "mention", "assigned", "comment"
    actorName: v.string(),
    issueId: v.id("issues"),
    issueKey: v.string(),
    issueTitle: v.string(),
    issueType: v.string(),
    issuePriority: v.string(),
    projectName: v.string(),
    dueDate: v.optional(v.number()),
    commentText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { to, type, actorName, issueId, issueKey, issueTitle, issueType, issuePriority, projectName, dueDate, commentText } = args;

    // Send appropriate email based on type
    switch (type) {
      case "mention":
        return await ctx.runAction(internal.email.notifications.sendMentionEmail, {
          to,
          mentionedByName: actorName,
          issueKey,
          issueTitle,
          issueId,
          commentText,
          projectName,
        });

      case "assigned":
        return await ctx.runAction(internal.email.notifications.sendAssignmentEmail, {
          to,
          assignedByName: actorName,
          issueKey,
          issueTitle,
          issueId,
          issueType,
          issuePriority,
          projectName,
          dueDate: dueDate ? new Date(dueDate).toLocaleDateString() : undefined,
        });

      case "comment":
        return await ctx.runAction(internal.email.notifications.sendCommentEmail, {
          to,
          commenterName: actorName,
          issueKey,
          issueTitle,
          issueId,
          commentText: commentText || "",
          projectName,
        });

      default:
        console.warn("Unknown notification type:", type);
        return { success: false, error: "Unknown notification type" };
    }
  },
});
