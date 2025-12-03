/**
 * E2E Testing Helpers
 *
 * Provides utilities for E2E tests:
 * - Create test users (bypassing email verification for speed)
 * - Delete test users
 * - Reset onboarding state
 * - Garbage collection for old test users
 *
 * Only works for emails ending in @inbox.mailtrap.io (test emails).
 * Real email verification is tested separately using Mailtrap API.
 */

import { httpAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Test user expiration (1 hour - for garbage collection)
const TEST_USER_EXPIRATION_MS = 60 * 60 * 1000;

/**
 * Check if email is a test email
 */
function isTestEmail(email: string): boolean {
  return email.endsWith("@inbox.mailtrap.io");
}

/**
 * Create a test user (bypassing email verification)
 * POST /e2e/create-test-user
 * Body: { email: string, password: string, skipOnboarding?: boolean }
 *
 * This creates a user with email already verified, optionally completing onboarding.
 * Only works for test emails (@inbox.mailtrap.io).
 */
export const createTestUserEndpoint = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { email, password, skipOnboarding = false } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Missing email or password" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isTestEmail(email)) {
      return new Response(JSON.stringify({ error: "Only test emails allowed (@inbox.mailtrap.io)" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.createTestUserInternal, {
      email,
      password,
      skipOnboarding,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to create test user
 */
export const createTestUserInternal = internalMutation({
  args: {
    email: v.string(),
    password: v.string(),
    skipOnboarding: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!isTestEmail(args.email)) {
      throw new Error("Only test emails allowed");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existingUser) {
      // User exists - just return success (idempotent)
      return { success: true, userId: existingUser._id, existing: true };
    }

    // Create the user with email verified
    const userId = await ctx.db.insert("users", {
      email: args.email,
      emailVerificationTime: Date.now(),
      isTestUser: true,
      testUserCreatedAt: Date.now(),
    });

    // Create auth account (password hash would be handled by auth system)
    // Note: This is a simplified version - in practice, the user would sign up
    // through the UI and we'd use Mailtrap for email verification

    // If skipOnboarding is true, create completed onboarding record
    if (args.skipOnboarding) {
      await ctx.db.insert("userOnboarding", {
        userId,
        onboardingCompleted: true,
        onboardingStep: 5,
        sampleProjectCreated: false,
        tourShown: true,
        wizardCompleted: true,
        checklistDismissed: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { success: true, userId, existing: false };
  },
});

/**
 * Delete a test user
 * POST /e2e/delete-test-user
 * Body: { email: string }
 */
export const deleteTestUserEndpoint = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isTestEmail(email)) {
      return new Response(JSON.stringify({ error: "Only test emails allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.deleteTestUserInternal, { email });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to delete test user and all related data
 */
export const deleteTestUserInternal = internalMutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    if (!isTestEmail(args.email)) {
      throw new Error("Only test emails allowed");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (!user) {
      return { success: true, deleted: false };
    }

    // Delete user's onboarding record
    const onboarding = await ctx.db
      .query("userOnboarding")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    if (onboarding) {
      await ctx.db.delete(onboarding._id);
    }

    // Delete user's auth sessions (if any)
    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    // Delete user's auth accounts (if any)
    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", user._id))
      .collect();
    for (const account of accounts) {
      await ctx.db.delete(account._id);
    }

    // Delete the user
    await ctx.db.delete(user._id);

    return { success: true, deleted: true };
  },
});

/**
 * Reset onboarding for a specific user (by email)
 * POST /e2e/reset-onboarding
 * Body: { email?: string } - if not provided, resets ALL test users' onboarding
 */
export const resetOnboardingEndpoint = httpAction(async (ctx, request) => {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body as { email?: string };

    if (email && !isTestEmail(email)) {
      return new Response(JSON.stringify({ error: "Only test emails allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.resetOnboardingInternal, { email });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to reset onboarding
 */
export const resetOnboardingInternal = internalMutation({
  args: {
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.email) {
      // Reset specific user's onboarding
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), args.email))
        .first();

      if (!user) {
        return { success: false, error: "User not found" };
      }

      const onboarding = await ctx.db
        .query("userOnboarding")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (onboarding) {
        await ctx.db.delete(onboarding._id);
      }

      return { success: true, reset: 1 };
    }

    // Reset ALL test users' onboarding (for cleanup)
    const testUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isTestUser"), true))
      .collect();

    let resetCount = 0;
    for (const user of testUsers) {
      const onboarding = await ctx.db
        .query("userOnboarding")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (onboarding) {
        await ctx.db.delete(onboarding._id);
        resetCount++;
      }
    }

    return { success: true, reset: resetCount };
  },
});

/**
 * Garbage collection - delete old test users
 * POST /e2e/cleanup
 * Deletes test users older than 1 hour
 */
export const cleanupTestUsersEndpoint = httpAction(async (ctx) => {
  try {
    const result = await ctx.runMutation(internal.e2e.cleanupTestUsersInternal, {});
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation for garbage collection
 */
export const cleanupTestUsersInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoffTime = Date.now() - TEST_USER_EXPIRATION_MS;

    // Find test users older than cutoff
    const oldTestUsers = await ctx.db
      .query("users")
      .filter((q) =>
        q.and(
          q.eq(q.field("isTestUser"), true),
          q.lt(q.field("testUserCreatedAt"), cutoffTime)
        )
      )
      .collect();

    let deletedCount = 0;
    for (const user of oldTestUsers) {
      // Delete onboarding
      const onboarding = await ctx.db
        .query("userOnboarding")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();
      if (onboarding) {
        await ctx.db.delete(onboarding._id);
      }

      // Delete sessions
      const sessions = await ctx.db
        .query("authSessions")
        .withIndex("userId", (q) => q.eq("userId", user._id))
        .collect();
      for (const session of sessions) {
        await ctx.db.delete(session._id);
      }

      // Delete accounts
      const accounts = await ctx.db
        .query("authAccounts")
        .withIndex("userIdAndProvider", (q) => q.eq("userId", user._id))
        .collect();
      for (const account of accounts) {
        await ctx.db.delete(account._id);
      }

      // Delete user
      await ctx.db.delete(user._id);
      deletedCount++;
    }

    return { success: true, deleted: deletedCount };
  },
});

// Legacy exports for backwards compatibility (can be removed later)
export const resetAllOnboarding = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Delete all userOnboarding records for test users
    const records = await ctx.db.query("userOnboarding").collect();
    for (const record of records) {
      await ctx.db.delete(record._id);
    }
    return { deleted: records.length };
  },
});
