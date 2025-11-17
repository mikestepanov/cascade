/**
 * Email Notification Functions
 *
 * Sends notification emails for various events (mentions, assignments, comments)
 */

import { render } from "@react-email/render";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { sendEmail } from "./index";

/**
 * Send a mention notification email
 */
export const sendMentionEmail = internalAction({
  args: {
    to: v.string(),
    userId: v.id("users"),
    mentionedByName: v.string(),
    issueKey: v.string(),
    issueTitle: v.string(),
    issueId: v.id("issues"),
    commentText: v.optional(v.string()),
    projectName: v.string(),
  },
  handler: async (ctx, args) => {
    const { to, userId, mentionedByName, issueKey, issueTitle, commentText, projectName, issueId } =
      args;

    // Generate issue URL and unsubscribe URL
    const appUrl = process.env.APP_URL || "http://localhost:5173";
    const issueUrl = `${appUrl}/issues/${issueId}`;

    // Generate unsubscribe token
    const token = await ctx.runMutation(internal.unsubscribe.generateTokenInternal, { userId });
    const unsubscribeUrl = `${appUrl}/unsubscribe?token=${token}`;

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
        unsubscribeUrl,
      }),
    );

    // Send email
    const result = await sendEmail({
      to,
      subject: `${mentionedByName} mentioned you in ${issueKey}`,
      html,
      text: `${mentionedByName} mentioned you in ${issueKey}: ${issueTitle}\n\nView: ${issueUrl}\n\nUnsubscribe: ${unsubscribeUrl}`,
    });

    return result;
  },
});

/**
 * Send an assignment notification email
 */
export const sendAssignmentEmail = internalAction({
  args: {
    to: v.string(),
    userId: v.id("users"),
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
      userId,
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

    // Generate unsubscribe token
    const token = await ctx.runMutation(internal.unsubscribe.generateTokenInternal, { userId });
    const unsubscribeUrl = `${appUrl}/unsubscribe?token=${token}`;

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
        unsubscribeUrl,
      }),
    );

    const result = await sendEmail({
      to,
      subject: `You were assigned to ${issueKey}: ${issueTitle}`,
      html,
      text: `${assignedByName} assigned you to ${issueKey}: ${issueTitle}\n\nView: ${issueUrl}\n\nUnsubscribe: ${unsubscribeUrl}`,
    });

    return result;
  },
});

/**
 * Send a comment notification email
 */
export const sendCommentEmail = internalAction({
  args: {
    to: v.string(),
    userId: v.id("users"),
    commenterName: v.string(),
    issueKey: v.string(),
    issueTitle: v.string(),
    issueId: v.id("issues"),
    commentText: v.string(),
    projectName: v.string(),
  },
  handler: async (ctx, args) => {
    const { to, userId, commenterName, issueKey, issueTitle, issueId, commentText, projectName } =
      args;

    const appUrl = process.env.APP_URL || "http://localhost:5173";
    const issueUrl = `${appUrl}/issues/${issueId}`;

    // Generate unsubscribe token
    const token = await ctx.runMutation(internal.unsubscribe.generateTokenInternal, { userId });
    const unsubscribeUrl = `${appUrl}/unsubscribe?token=${token}`;

    const { CommentEmail } = await import("../../emails/CommentEmail");

    const html = await render(
      CommentEmail({
        commenterName,
        issueKey,
        issueTitle,
        commentText,
        issueUrl,
        projectName,
        unsubscribeUrl,
      }),
    );

    const result = await sendEmail({
      to,
      subject: `${commenterName} commented on ${issueKey}`,
      html,
      text: `${commenterName} commented on ${issueKey}: ${issueTitle}\n\n"${commentText}"\n\nView: ${issueUrl}\n\nUnsubscribe: ${unsubscribeUrl}`,
    });

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
    userId: v.id("users"), // User ID for unsubscribe token
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
    const {
      to,
      userId,
      type,
      actorName,
      issueId,
      issueKey,
      issueTitle,
      issueType,
      issuePriority,
      projectName,
      dueDate,
      commentText,
    } = args;

    // Send appropriate email based on type
    switch (type) {
      case "mention":
        return await ctx.runAction(internal.email.notifications.sendMentionEmail, {
          to,
          userId,
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
          userId,
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
          userId,
          commenterName: actorName,
          issueKey,
          issueTitle,
          issueId,
          commentText: commentText || "",
          projectName,
        });

      default:
        return { success: false, error: `Unknown notification type: ${type}` };
    }
  },
});

/**
 * Send a daily or weekly digest email
 */
export const sendDigestEmail = internalAction({
  args: {
    userId: v.id("users"),
    frequency: v.union(v.literal("daily"), v.literal("weekly")),
  },
  handler: async (ctx, args) => {
    const { userId, frequency } = args;

    // Get user details
    const user = await ctx.runQuery(internal.users.get, { id: userId });
    if (!user?.email) {
      return { success: false, error: "No email found" }; // User has no email address
    }

    // Calculate time range
    const now = Date.now();
    const timeRange =
      frequency === "daily"
        ? 24 * 60 * 60 * 1000 // 24 hours
        : 7 * 24 * 60 * 60 * 1000; // 7 days
    const startTime = now - timeRange;

    // Get notifications from the time range
    const notifications = await ctx.runQuery(internal.notifications.listForDigest, {
      userId,
      startTime,
    });

    // If no notifications, optionally skip sending (or send empty digest)
    if (notifications.length === 0) {
      return { success: true, id: "no-notifications" };
    }

    // Generate unsubscribe token
    const token = await ctx.runMutation(internal.unsubscribe.generateTokenInternal, { userId });
    const appUrl = process.env.APP_URL || "http://localhost:5173";
    const unsubscribeUrl = `${appUrl}/unsubscribe?token=${token}`;

    // Format dates
    const startDate = new Date(startTime).toLocaleDateString();
    const endDate = new Date(now).toLocaleDateString();

    // Import the digest email template
    const { DigestEmail } = await import("../../emails/DigestEmail");

    // Format notifications into digest items
    const items = notifications.map((n) => ({
      type: n.type,
      issueKey: n.issueKey || "Unknown",
      issueTitle: n.title,
      issueUrl: `${appUrl}/issues/${n.issueId}`,
      actorName: n.actorName || "Someone",
      message: n.message,
      time: new Date(n.createdAt).toLocaleString(),
    }));

    // Render email
    const html = await render(
      DigestEmail({
        userName: user.name || "there",
        frequency,
        items,
        startDate,
        endDate,
        unsubscribeUrl,
      }),
    );

    // Send email
    const result = await sendEmail({
      to: user.email,
      subject: `Your ${frequency} digest: ${items.length} notification${items.length !== 1 ? "s" : ""}`,
      html,
      text: `Your ${frequency} digest:\n\n${items.map((i) => `${i.issueKey}: ${i.actorName} ${i.message}`).join("\n")}\n\nUnsubscribe: ${unsubscribeUrl}`,
    });

    return result;
  },
});
