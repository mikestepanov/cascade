import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, type QueryCtx, query } from "./_generated/server";
import { sendEmail } from "./email/index";

// Helper: Check if user is a platform admin
async function isPlatformAdmin(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  // Primary: Check if user is admin or owner in any company
  const companyMembership = await ctx.db
    .query("companyMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) => q.or(q.eq(q.field("role"), "admin"), q.eq(q.field("role"), "owner")))
    .first();

  if (companyMembership) return true;

  // Fallback: Check if user has created a project (backward compatibility)
  const createdProjects = await ctx.db
    .query("projects")
    .withIndex("by_creator", (q) => q.eq("createdBy", userId))
    .first();

  if (createdProjects) return true;

  // Fallback: Check if user has admin role in any project (backward compatibility)
  const adminMembership = await ctx.db
    .query("projectMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("role"), "admin"))
    .first();

  return !!adminMembership;
}

// Generate a cryptographically secure invite token
function generateInviteToken(): string {
  const timestamp = Date.now().toString(36);
  // Use crypto.randomUUID() for secure random generation
  const randomPart = crypto.randomUUID().replace(/-/g, "");
  return `invite_${timestamp}_${randomPart}`;
}

/**
 * Send an invitation to a user
 * Only admins can send invites
 */
export const sendInvite = mutation({
  args: {
    email: v.string(),
    role: v.union(v.literal("user"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user is admin
    const isAdmin = await isPlatformAdmin(ctx, userId);
    if (!isAdmin) {
      throw new Error("Only admins can send invites");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.email)) {
      throw new Error("Invalid email address");
    }

    // Check if user already exists with this email
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existingUser) {
      throw new Error("A user with this email already exists");
    }

    // Check if there's already a pending invite for this email
    const existingInvite = await ctx.db
      .query("invites")
      .withIndex("by_email_status", (q) => q.eq("email", args.email).eq("status", "pending"))
      .first();

    if (existingInvite) {
      throw new Error("An invitation has already been sent to this email");
    }

    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days from now
    const token = generateInviteToken();

    const inviteId = await ctx.db.insert("invites", {
      email: args.email,
      role: args.role,
      invitedBy: userId,
      token,
      expiresAt,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    // Send email with invite link
    const inviteLink = `${process.env.SITE_URL}/invite/${token}`;

    await sendEmail({
      to: args.email,
      subject: "You've been invited to Nixelo",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Nixelo</h2>
          <p>You have been invited to join Nixelo as a <strong>${args.role}</strong>.</p>
          <p>Click the button below to accept your invitation:</p>
          <a href="${inviteLink}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Accept Invitation</a>
          <p style="color: #666; font-size: 14px;">This link will expire in 7 days.</p>
        </div>
      `,
      text: `You have been invited to join Nixelo as a ${args.role}. Accept your invitation here: ${inviteLink}`,
    });

    return { inviteId, token };
  },
});

/**
 * Revoke an invitation
 * Only admins can revoke invites
 */
export const revokeInvite = mutation({
  args: {
    inviteId: v.id("invites"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user is admin
    const isAdmin = await isPlatformAdmin(ctx, userId);
    if (!isAdmin) {
      throw new Error("Only admins can revoke invites");
    }

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      throw new Error("Invite not found");
    }

    if (invite.status !== "pending") {
      throw new Error("Can only revoke pending invites");
    }

    await ctx.db.patch(args.inviteId, {
      status: "revoked",
      revokedBy: userId,
      revokedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Resend an invitation
 * Only admins can resend invites
 */
export const resendInvite = mutation({
  args: {
    inviteId: v.id("invites"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user is admin
    const isAdmin = await isPlatformAdmin(ctx, userId);
    if (!isAdmin) {
      throw new Error("Only admins can resend invites");
    }

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      throw new Error("Invite not found");
    }

    if (invite.status !== "pending") {
      throw new Error("Can only resend pending invites");
    }

    // Extend expiration by another 7 days
    const newExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    await ctx.db.patch(args.inviteId, {
      expiresAt: newExpiresAt,
      updatedAt: Date.now(),
    });

    // Send email with invite link again
    const inviteLink = `${process.env.SITE_URL}/invite/${invite.token}`;

    await sendEmail({
      to: invite.email,
      subject: "Invitation to Nixelo",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Invitation Reminder</h2>
          <p>This is a reminder that you have been invited to join Nixelo.</p>
          <p>Click the button below to accept your invitation:</p>
          <a href="${inviteLink}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Accept Invitation</a>
          <p style="color: #666; font-size: 14px;">This link will expire in 7 days.</p>
        </div>
      `,
      text: `You have been invited to join Nixelo. Accept your invitation here: ${inviteLink}`,
    });

    return { success: true };
  },
});

/**
 * Get an invitation by token (for accepting invites)
 */
export const getInviteByToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invite) {
      return null;
    }

    // Check if expired (just for display, actual expiration check happens in acceptInvite)
    const isExpired = invite.status === "pending" && invite.expiresAt < Date.now();

    // Get inviter name
    const inviter = await ctx.db.get(invite.invitedBy);

    return {
      ...invite,
      isExpired,
      inviterName: inviter?.name || inviter?.email || "Unknown",
    };
  },
});

/**
 * Accept an invitation (called during signup)
 * This should be called after a user creates their account with the email from the invite
 */
export const acceptInvite = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const invite = await ctx.db
      .query("invites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invite) {
      throw new Error("Invalid invitation token");
    }

    if (invite.status !== "pending") {
      throw new Error(`This invitation is ${invite.status}`);
    }

    if (invite.expiresAt < Date.now()) {
      // Mark as expired
      await ctx.db.patch(invite._id, {
        status: "expired",
        updatedAt: Date.now(),
      });
      throw new Error("This invitation has expired");
    }

    // Verify the user's email matches the invite
    const user = await ctx.db.get(userId);
    if (user?.email !== invite.email) {
      throw new Error("This invitation was sent to a different email address");
    }

    // Mark invite as accepted
    await ctx.db.patch(invite._id, {
      status: "accepted",
      acceptedBy: userId,
      acceptedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, role: invite.role };
  },
});

/**
 * List all invitations (admin only)
 */
export const listInvites = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("revoked"),
        v.literal("expired"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user is admin
    const isAdmin = await isPlatformAdmin(ctx, userId);
    if (!isAdmin) {
      throw new Error("Only admins can view invitations");
    }

    // Filter by status if provided
    let invites: Doc<"invites">[];
    if (args.status !== undefined) {
      const status = args.status; // Extract to const for type narrowing
      invites = await ctx.db
        .query("invites")
        .withIndex("by_status", (q) => q.eq("status", status))
        .collect();
    } else {
      invites = await ctx.db.query("invites").collect();
    }

    // Get inviter names
    const invitesWithNames = await Promise.all(
      invites.map(async (invite) => {
        const inviter = (await ctx.db.get(invite.invitedBy)) as Doc<"users"> | null;
        let acceptedByName: string | undefined;
        if (invite.acceptedBy) {
          const acceptedUser = (await ctx.db.get(invite.acceptedBy)) as Doc<"users"> | null;
          acceptedByName = acceptedUser?.name || acceptedUser?.email || "Unknown";
        }
        return {
          ...invite,
          inviterName: inviter?.name || inviter?.email || "Unknown",
          acceptedByName,
        };
      }),
    );

    // Sort by created date (newest first)
    return invitesWithNames.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * List all users (admin only)
 */
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user is admin
    const isAdmin = await isPlatformAdmin(ctx, userId);
    if (!isAdmin) {
      throw new Error("Only admins can view users");
    }

    const users = await ctx.db.query("users").collect();

    // Get additional info for each user
    const usersWithInfo = await Promise.all(
      users.map(async (user) => {
        // Count projects created
        const projectsCreated = await ctx.db
          .query("projects")
          .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
          .collect();

        // Count project memberships
        const projectMemberships = await ctx.db
          .query("projectMembers")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          image: user.image,
          emailVerificationTime: user.emailVerificationTime,
          isAnonymous: user.isAnonymous,
          projectsCreated: projectsCreated.length,
          projectMemberships: projectMemberships.length,
        };
      }),
    );

    return usersWithInfo;
  },
});
