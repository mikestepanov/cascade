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

import { v } from "convex/values";
import { Scrypt } from "lucia";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { httpAction, internalMutation } from "./_generated/server";

// Test user expiration (1 hour - for garbage collection)
const TEST_USER_EXPIRATION_MS = 60 * 60 * 1000;

/**
 * Check if email is a test email
 */
function isTestEmail(email: string): boolean {
  return email.endsWith("@inbox.mailtrap.io");
}

/**
 * Validate E2E API key from request headers
 * Returns error Response if invalid, null if valid
 */
function validateE2EApiKey(request: Request): Response | null {
  const apiKey = process.env.E2E_API_KEY;

  // If no API key is configured, reject all requests in production
  if (!apiKey) {
    // Allow in development (no key configured = development mode)
    if (process.env.NODE_ENV === "production") {
      return new Response(JSON.stringify({ error: "E2E endpoints disabled in production" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    return null; // Allow in dev without key
  }

  const providedKey = request.headers.get("x-e2e-api-key");
  if (providedKey !== apiKey) {
    return new Response(JSON.stringify({ error: "Invalid or missing E2E API key" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return null; // Valid
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
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { email, password, skipOnboarding = false } = body;

    if (!(email && password)) {
      return new Response(JSON.stringify({ error: "Missing email or password" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isTestEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Only test emails allowed (@inbox.mailtrap.io)" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Hash the password using Scrypt (same as Convex Auth)
    const scrypt = new Scrypt();
    const passwordHash = await scrypt.hash(password);

    const result = await ctx.runMutation(internal.e2e.createTestUserInternal, {
      email,
      passwordHash,
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
 * Internal mutation to create test user with full auth credentials
 */
export const createTestUserInternal = internalMutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    skipOnboarding: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
    userId: v.id("users"),
    existing: v.boolean(),
  }),
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
      // User exists - check if authAccount exists too
      const existingAccount = await ctx.db
        .query("authAccounts")
        .filter((q) => q.eq(q.field("providerAccountId"), args.email))
        .first();

      if (!existingAccount) {
        // User exists but no authAccount - create it
        await ctx.db.insert("authAccounts", {
          userId: existingUser._id,
          provider: "password",
          providerAccountId: args.email,
          secret: args.passwordHash,
        });
      }

      // Ensure existing user has company and onboarding set up when skipOnboarding is true
      if (args.skipOnboarding) {
        const now = Date.now();

        // Check if user has onboarding record
        const existingOnboarding = await ctx.db
          .query("userOnboarding")
          .withIndex("by_user", (q) => q.eq("userId", existingUser._id))
          .first();

        if (!existingOnboarding) {
          await ctx.db.insert("userOnboarding", {
            userId: existingUser._id,
            onboardingCompleted: true,
            onboardingStep: 5,
            sampleWorkspaceCreated: false,
            tourShown: true,
            wizardCompleted: true,
            checklistDismissed: true,
            createdAt: now,
            updatedAt: now,
          });
        } else if (!existingOnboarding.onboardingCompleted) {
          // Mark existing onboarding as complete
          await ctx.db.patch(existingOnboarding._id, {
            onboardingCompleted: true,
            onboardingStep: 5,
          });
        }

        // Check if user has company membership
        const existingMembership = await ctx.db
          .query("companyMembers")
          .withIndex("by_user", (q) => q.eq("userId", existingUser._id))
          .first();

        if (!existingMembership) {
          // Check if shared E2E test company already exists
          const companyName = "Nixelo E2E";
          const slug = "nixelo-e2e";

          const existingCompany = await ctx.db
            .query("companies")
            .withIndex("by_slug", (q) => q.eq("slug", slug))
            .first();

          let companyId: Id<"companies">;

          if (existingCompany) {
            // Company exists - just add this user as a member
            companyId = existingCompany._id;
          } else {
            // Create the company
            companyId = await ctx.db.insert("companies", {
              name: companyName,
              slug,
              timezone: "UTC",
              settings: {
                defaultMaxHoursPerWeek: 40,
                defaultMaxHoursPerDay: 8,
                requiresTimeApproval: false,
                billingEnabled: true,
              },
              createdBy: existingUser._id,
              createdAt: now,
              updatedAt: now,
            });
          }

          await ctx.db.insert("companyMembers", {
            companyId,
            userId: existingUser._id,
            role: "admin",
            addedBy: existingUser._id,
            addedAt: now,
          });

          await ctx.db.patch(existingUser._id, { defaultCompanyId: companyId });
        }
      }

      return { success: true, userId: existingUser._id, existing: true };
    }

    // Create the user with email verified
    const userId = await ctx.db.insert("users", {
      email: args.email,
      emailVerificationTime: Date.now(),
      isTestUser: true,
      testUserCreatedAt: Date.now(),
    });

    // Create auth account with password hash
    await ctx.db.insert("authAccounts", {
      userId,
      provider: "password",
      providerAccountId: args.email,
      secret: args.passwordHash,
    });

    // If skipOnboarding is true, create completed onboarding record AND add to shared company
    if (args.skipOnboarding) {
      const now = Date.now();

      // Create onboarding record
      await ctx.db.insert("userOnboarding", {
        userId,
        onboardingCompleted: true,
        onboardingStep: 5,
        sampleWorkspaceCreated: false,
        tourShown: true,
        wizardCompleted: true,
        checklistDismissed: true,
        createdAt: now,
        updatedAt: now,
      });

      // Check if shared E2E test company already exists
      const companyName = "Nixelo E2E";
      const slug = "nixelo-e2e";

      const existingCompany = await ctx.db
        .query("companies")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();

      let companyId: Id<"companies">;

      if (existingCompany) {
        // Company exists - just add this user as a member
        companyId = existingCompany._id;
      } else {
        // Create the company (first user creates it)
        companyId = await ctx.db.insert("companies", {
          name: companyName,
          slug,
          timezone: "UTC",
          settings: {
            defaultMaxHoursPerWeek: 40,
            defaultMaxHoursPerDay: 8,
            requiresTimeApproval: false,
            billingEnabled: true,
          },
          createdBy: userId,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Add user as admin of the company
      await ctx.db.insert("companyMembers", {
        companyId,
        userId,
        role: "admin",
        addedBy: userId,
        addedAt: now,
      });

      // Set as user's default company
      await ctx.db.patch(userId, { defaultCompanyId: companyId });
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
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

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
  returns: v.object({
    success: v.boolean(),
    deleted: v.boolean(),
    deletedAccounts: v.number(),
  }),
  handler: async (ctx, args) => {
    if (!isTestEmail(args.email)) {
      throw new Error("Only test emails allowed");
    }

    let deletedUserData = false;
    let deletedAccountsCount = 0;

    // First, delete any authAccounts by email (providerAccountId) - this catches orphaned accounts
    // For password provider, providerAccountId is the email address
    const accountsByEmail = await ctx.db
      .query("authAccounts")
      .filter((q) => q.eq(q.field("providerAccountId"), args.email))
      .collect();
    for (const account of accountsByEmail) {
      await ctx.db.delete(account._id);
      deletedAccountsCount++;
    }

    // Note: authVerificationCodes doesn't have an identifier field we can filter on
    // Orphaned verification codes will be garbage collected by the auth system

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (user) {
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

      // Delete user's auth accounts by userId (might be duplicates from above)
      const accounts = await ctx.db
        .query("authAccounts")
        .withIndex("userIdAndProvider", (q) => q.eq("userId", user._id))
        .collect();
      for (const account of accounts) {
        await ctx.db.delete(account._id);
        deletedAccountsCount++;
      }

      // Note: authRefreshTokens are tied to sessions, which we've already deleted
      // The auth system will clean up orphaned refresh tokens

      // Delete user's company memberships and any companies they created
      const memberships = await ctx.db
        .query("companyMembers")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      for (const membership of memberships) {
        // Check if user is the company creator - if so, delete the company
        const company = await ctx.db.get(membership.companyId);
        if (company?.createdBy === user._id) {
          // Delete all members of this company first
          const companyMembers = await ctx.db
            .query("companyMembers")
            .withIndex("by_company", (q) => q.eq("companyId", company._id))
            .collect();
          for (const member of companyMembers) {
            await ctx.db.delete(member._id);
          }
          // Delete the company
          await ctx.db.delete(company._id);
        } else {
          // Just delete the membership
          await ctx.db.delete(membership._id);
        }
      }

      // Delete the user
      await ctx.db.delete(user._id);
      deletedUserData = true;
    }

    return {
      success: true,
      deleted: deletedUserData || deletedAccountsCount > 0,
      deletedAccounts: deletedAccountsCount,
    };
  },
});

/**
 * Reset onboarding for a specific user (by email)
 * POST /e2e/reset-onboarding
 * Body: { email?: string } - if not provided, resets ALL test users' onboarding
 */
export const resetOnboardingEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

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
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    reset: v.optional(v.number()),
  }),
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
export const cleanupTestUsersEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

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
  returns: v.object({
    success: v.boolean(),
    deleted: v.number(),
  }),
  handler: async (ctx) => {
    const cutoffTime = Date.now() - TEST_USER_EXPIRATION_MS;

    // Find test users older than cutoff
    const oldTestUsers = await ctx.db
      .query("users")
      .filter((q) =>
        q.and(q.eq(q.field("isTestUser"), true), q.lt(q.field("testUserCreatedAt"), cutoffTime)),
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

/**
 * Set up RBAC test project with users assigned to specific roles
 * POST /e2e/setup-rbac-project
 * Body: {
 *   projectKey: string,
 *   adminEmail: string,
 *   editorEmail: string,
 *   viewerEmail: string
 * }
 *
 * Creates a project and assigns users with their respective roles.
 * Returns the project ID for use in tests.
 */
export const setupRbacProjectEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { projectKey, adminEmail, editorEmail, viewerEmail } = body;

    if (!(projectKey && adminEmail && editorEmail && viewerEmail)) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: projectKey, adminEmail, editorEmail, viewerEmail",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Validate all emails are test emails
    for (const email of [adminEmail, editorEmail, viewerEmail]) {
      if (!isTestEmail(email)) {
        return new Response(JSON.stringify({ error: `Only test emails allowed: ${email}` }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const result = await ctx.runMutation(internal.e2e.setupRbacProjectInternal, {
      projectKey,
      adminEmail,
      editorEmail,
      viewerEmail,
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
 * Internal mutation to set up RBAC test project
 * Uses the admin user's existing company instead of creating a new one
 */
export const setupRbacProjectInternal = internalMutation({
  args: {
    projectKey: v.string(),
    adminEmail: v.string(),
    editorEmail: v.string(),
    viewerEmail: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    projectId: v.optional(v.id("projects")),
    projectKey: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    companySlug: v.optional(v.string()),
    // New hierarchy fields
    workspaceId: v.optional(v.id("workspaces")),
    teamId: v.optional(v.id("teams")),
    workspaceProjectId: v.optional(v.id("projects")),
    workspaceProjectKey: v.optional(v.string()),
    teamProjectId: v.optional(v.id("projects")),
    teamProjectKey: v.optional(v.string()),
    error: v.optional(v.string()),
    users: v.optional(
      v.object({
        admin: v.optional(v.id("users")),
        editor: v.optional(v.id("users")),
        viewer: v.optional(v.id("users")),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    // Find all users
    const adminUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.adminEmail))
      .first();
    const editorUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.editorEmail))
      .first();
    const viewerUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.viewerEmail))
      .first();

    if (!adminUser) {
      return { success: false, error: `Admin user not found: ${args.adminEmail}` };
    }
    if (!editorUser) {
      return { success: false, error: `Editor user not found: ${args.editorEmail}` };
    }
    if (!viewerUser) {
      return { success: false, error: `Viewer user not found: ${args.viewerEmail}` };
    }

    const now = Date.now();

    // =========================================================================
    // Step 1: Find the admin user's existing company (created during login)
    // =========================================================================
    const adminMembership = await ctx.db
      .query("companyMembers")
      .withIndex("by_user", (q) => q.eq("userId", adminUser._id))
      .first();

    if (!adminMembership) {
      return { success: false, error: "Admin user has no company membership" };
    }

    const company = await ctx.db.get(adminMembership.companyId);
    if (!company) {
      return { success: false, error: "Admin's company not found" };
    }

    // =========================================================================
    // Step 2: Add editor and viewer as company members (if not already)
    // =========================================================================
    const usersToAddToCompany = [
      { userId: editorUser._id, role: "member" as const },
      { userId: viewerUser._id, role: "member" as const },
    ];

    for (const config of usersToAddToCompany) {
      const existingMember = await ctx.db
        .query("companyMembers")
        .withIndex("by_company_user", (q) =>
          q.eq("companyId", company._id).eq("userId", config.userId),
        )
        .first();

      if (!existingMember) {
        await ctx.db.insert("companyMembers", {
          companyId: company._id,
          userId: config.userId,
          role: config.role,
          addedBy: adminUser._id,
          addedAt: now,
        });
      }

      // Set as user's default company
      await ctx.db.patch(config.userId, { defaultCompanyId: company._id });
    }

    // =========================================================================
    // Step 3: Create workspace and team for hierarchical testing
    // =========================================================================

    // Create a workspace (department) for the company
    const workspaceId = await ctx.db.insert("workspaces", {
      name: "E2E Testing Workspace",
      slug: "e2e-testing",
      description: "Workspace for E2E RBAC testing",
      icon: "🧪",
      companyId: company._id,
      createdBy: adminUser._id,
      createdAt: now,
      updatedAt: now,
    });

    // Create a team within the workspace
    const teamId = await ctx.db.insert("teams", {
      name: "E2E Test Team",
      slug: "e2e-test-team",
      description: "Team for E2E RBAC testing",
      workspaceId,
      companyId: company._id,
      createdBy: adminUser._id,
      createdAt: now,
      updatedAt: now,
      isPrivate: false, // Public team for testing
    });

    // Add all users to the team with appropriate roles
    await ctx.db.insert("teamMembers", {
      teamId,
      userId: adminUser._id,
      role: "lead",
      addedBy: adminUser._id,
      addedAt: now,
    });
    await ctx.db.insert("teamMembers", {
      teamId,
      userId: editorUser._id,
      role: "member",
      addedBy: adminUser._id,
      addedAt: now,
    });
    await ctx.db.insert("teamMembers", {
      teamId,
      userId: viewerUser._id,
      role: "member",
      addedBy: adminUser._id,
      addedAt: now,
    });

    // =========================================================================
    // Step 4: Create RBAC test projects at different hierarchy levels
    // =========================================================================

    // 4a. Company-level project (legacy style - no workspace/team)
    let project = await ctx.db
      .query("projects")
      .withIndex("by_key", (q) => q.eq("key", args.projectKey))
      .first();

    if (!project) {
      const projectId = await ctx.db.insert("projects", {
        name: `RBAC Test Project (${args.projectKey})`,
        key: args.projectKey,
        description: "E2E test project for RBAC permission testing - Company level",
        companyId: company._id,
        ownerId: adminUser._id,
        createdBy: adminUser._id,
        createdAt: now,
        updatedAt: now,
        boardType: "kanban",
        workflowStates: [
          { id: "backlog", name: "Backlog", category: "todo", order: 0 },
          { id: "todo", name: "To Do", category: "todo", order: 1 },
          { id: "in-progress", name: "In Progress", category: "inprogress", order: 2 },
          { id: "review", name: "Review", category: "inprogress", order: 3 },
          { id: "done", name: "Done", category: "done", order: 4 },
        ],
        // Explicitly undefined for company-level project
        workspaceId: undefined,
        teamId: undefined,
      });

      project = await ctx.db.get(projectId);
    } else if (!project.companyId) {
      await ctx.db.patch(project._id, { companyId: company._id });
    }

    if (!project) {
      return { success: false, error: "Failed to create company-level project" };
    }

    // 4b. Workspace-level project
    const workspaceProjectKey = `${args.projectKey}-WS`;
    let workspaceProject = await ctx.db
      .query("projects")
      .withIndex("by_key", (q) => q.eq("key", workspaceProjectKey))
      .first();

    if (!workspaceProject) {
      const wsProjectId = await ctx.db.insert("projects", {
        name: `RBAC Workspace Project (${workspaceProjectKey})`,
        key: workspaceProjectKey,
        description: "E2E test project for RBAC - Workspace level",
        companyId: company._id,
        workspaceId,
        teamId: undefined, // Workspace level, no specific team
        ownerId: adminUser._id,
        createdBy: adminUser._id,
        createdAt: now,
        updatedAt: now,
        boardType: "kanban",
        workflowStates: [
          { id: "backlog", name: "Backlog", category: "todo", order: 0 },
          { id: "todo", name: "To Do", category: "todo", order: 1 },
          { id: "in-progress", name: "In Progress", category: "inprogress", order: 2 },
          { id: "review", name: "Review", category: "inprogress", order: 3 },
          { id: "done", name: "Done", category: "done", order: 4 },
        ],
      });

      workspaceProject = await ctx.db.get(wsProjectId);
    }

    // 4c. Team-level project
    const teamProjectKey = `${args.projectKey}-TM`;
    let teamProject = await ctx.db
      .query("projects")
      .withIndex("by_key", (q) => q.eq("key", teamProjectKey))
      .first();

    if (!teamProject) {
      const tmProjectId = await ctx.db.insert("projects", {
        name: `RBAC Team Project (${teamProjectKey})`,
        key: teamProjectKey,
        description: "E2E test project for RBAC - Team level",
        companyId: company._id,
        workspaceId,
        teamId,
        ownerId: adminUser._id,
        createdBy: adminUser._id,
        createdAt: now,
        updatedAt: now,
        boardType: "kanban",
        workflowStates: [
          { id: "backlog", name: "Backlog", category: "todo", order: 0 },
          { id: "todo", name: "To Do", category: "todo", order: 1 },
          { id: "in-progress", name: "In Progress", category: "inprogress", order: 2 },
          { id: "review", name: "Review", category: "inprogress", order: 3 },
          { id: "done", name: "Done", category: "done", order: 4 },
        ],
      });

      teamProject = await ctx.db.get(tmProjectId);
    }

    // =========================================================================
    // Step 5: Add/update project members with roles for all projects
    // =========================================================================
    const projectId = project._id;
    const memberConfigs = [
      { userId: adminUser._id, role: "admin" as const },
      { userId: editorUser._id, role: "editor" as const },
      { userId: viewerUser._id, role: "viewer" as const },
    ];

    // Add members to all three projects
    const allProjects = [project, workspaceProject, teamProject].filter(
      (p): p is NonNullable<typeof p> => p !== null && p !== undefined,
    );

    for (const proj of allProjects) {
      for (const config of memberConfigs) {
        const existingMember = await ctx.db
          .query("projectMembers")
          .withIndex("by_workspace_user", (q) =>
            q.eq("projectId", proj._id).eq("userId", config.userId),
          )
          .first();

        if (existingMember) {
          // Update role if different
          if (existingMember.role !== config.role) {
            await ctx.db.patch(existingMember._id, { role: config.role });
          }
        } else {
          // Add new member
          await ctx.db.insert("projectMembers", {
            projectId: proj._id,
            userId: config.userId,
            role: config.role,
            addedBy: adminUser._id,
            addedAt: now,
          });
        }
      }
    }

    return {
      success: true,
      projectId: project._id,
      projectKey: project.key,
      companyId: company._id,
      companySlug: company.slug,
      // Return all project info for comprehensive testing
      workspaceId,
      teamId,
      workspaceProjectId: workspaceProject?._id,
      workspaceProjectKey: workspaceProject?.key,
      teamProjectId: teamProject?._id,
      teamProjectKey: teamProject?.key,
      users: {
        admin: adminUser._id,
        editor: editorUser._id,
        viewer: viewerUser._id,
      },
    };
  },
});

/**
 * Clean up RBAC test project and its data
 * POST /e2e/cleanup-rbac-project
 * Body: { projectKey: string }
 */
export const cleanupRbacProjectEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { projectKey } = body;

    if (!projectKey) {
      return new Response(JSON.stringify({ error: "Missing projectKey" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.cleanupRbacProjectInternal, { projectKey });

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
 * Internal mutation to clean up RBAC test project
 */
export const cleanupRbacProjectInternal = internalMutation({
  args: {
    projectKey: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    deleted: v.object({
      project: v.boolean(),
      members: v.number(),
      issues: v.number(),
      sprints: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("projects")
      .withIndex("by_key", (q) => q.eq("key", args.projectKey))
      .first();

    if (!project) {
      return {
        success: true,
        deleted: { project: false, members: 0, issues: 0, sprints: 0 },
      };
    }

    // Delete all project members
    const members = await ctx.db
      .query("projectMembers")
      .withIndex("by_workspace", (q) => q.eq("projectId", project._id))
      .collect();
    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Delete all issues
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_workspace", (q) => q.eq("projectId", project._id))
      .collect();
    for (const issue of issues) {
      // Delete issue comments
      const comments = await ctx.db
        .query("issueComments")
        .withIndex("by_issue", (q) => q.eq("issueId", issue._id))
        .collect();
      for (const comment of comments) {
        await ctx.db.delete(comment._id);
      }
      // Delete issue activity
      const activities = await ctx.db
        .query("issueActivity")
        .withIndex("by_issue", (q) => q.eq("issueId", issue._id))
        .collect();
      for (const activity of activities) {
        await ctx.db.delete(activity._id);
      }
      await ctx.db.delete(issue._id);
    }

    // Delete all sprints
    const sprints = await ctx.db
      .query("sprints")
      .withIndex("by_workspace", (q) => q.eq("projectId", project._id))
      .collect();
    for (const sprint of sprints) {
      await ctx.db.delete(sprint._id);
    }

    // Delete the project
    await ctx.db.delete(project._id);

    return {
      success: true,
      deleted: {
        project: true,
        members: members.length,
        issues: issues.length,
        sprints: sprints.length,
      },
    };
  },
});

/**
 * Update company settings for E2E testing
 * POST /e2e/update-company-settings
 * Body: {
 *   companySlug: string,
 *   settings: {
 *     defaultMaxHoursPerWeek?: number,
 *     defaultMaxHoursPerDay?: number,
 *     requiresTimeApproval?: boolean,
 *     billingEnabled?: boolean,
 *   }
 * }
 *
 * Allows tests to change settings profiles (e.g., enable/disable billing).
 */
export const updateCompanySettingsEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { companySlug, settings } = body;

    if (!companySlug) {
      return new Response(JSON.stringify({ error: "Missing companySlug" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!settings || typeof settings !== "object") {
      return new Response(JSON.stringify({ error: "Missing or invalid settings" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.updateCompanySettingsInternal, {
      companySlug,
      settings,
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 404,
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
 * Internal mutation to update company settings
 */
export const updateCompanySettingsInternal = internalMutation({
  args: {
    companySlug: v.string(),
    settings: v.object({
      defaultMaxHoursPerWeek: v.optional(v.number()),
      defaultMaxHoursPerDay: v.optional(v.number()),
      requiresTimeApproval: v.optional(v.boolean()),
      billingEnabled: v.optional(v.boolean()),
    }),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    updatedSettings: v.optional(
      v.object({
        defaultMaxHoursPerWeek: v.number(),
        defaultMaxHoursPerDay: v.number(),
        requiresTimeApproval: v.boolean(),
        billingEnabled: v.boolean(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    // Find company by slug
    const company = await ctx.db
      .query("companies")
      .withIndex("by_slug", (q) => q.eq("slug", args.companySlug))
      .first();

    if (!company) {
      return { success: false, error: `Company not found: ${args.companySlug}` };
    }

    // Get current settings or use defaults
    const currentSettings = company.settings ?? {
      defaultMaxHoursPerWeek: 40,
      defaultMaxHoursPerDay: 8,
      requiresTimeApproval: false,
      billingEnabled: true,
    };

    // Merge with provided settings
    const newSettings = {
      defaultMaxHoursPerWeek:
        args.settings.defaultMaxHoursPerWeek ?? currentSettings.defaultMaxHoursPerWeek,
      defaultMaxHoursPerDay:
        args.settings.defaultMaxHoursPerDay ?? currentSettings.defaultMaxHoursPerDay,
      requiresTimeApproval:
        args.settings.requiresTimeApproval ?? currentSettings.requiresTimeApproval,
      billingEnabled: args.settings.billingEnabled ?? currentSettings.billingEnabled,
    };

    // Update company settings
    await ctx.db.patch(company._id, {
      settings: newSettings,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      companyId: company._id,
      updatedSettings: newSettings,
    };
  },
});

/**
 * Verify a test user's email directly (bypassing email verification flow)
 * POST /e2e/verify-test-user
 * Body: { email: string }
 */
export const verifyTestUserEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

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

    const result = await ctx.runMutation(internal.e2e.verifyTestUserInternal, { email });

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
 * Internal mutation to verify a test user's email
 */
export const verifyTestUserInternal = internalMutation({
  args: {
    email: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    verified: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    if (!isTestEmail(args.email)) {
      throw new Error("Only test emails allowed");
    }

    // Find the authAccount by email
    const account = await ctx.db
      .query("authAccounts")
      .filter((q) => q.eq(q.field("providerAccountId"), args.email))
      .first();

    if (!account) {
      return { success: false, verified: false, error: "Account not found" };
    }

    // Find the user
    const user = await ctx.db.get(account.userId);
    if (!user) {
      return { success: false, verified: false, error: "User not found" };
    }

    // Email is already verified via emailVerificationTime on user
    // No need to update authAccount - verification status is on users table

    // Update the user with emailVerificationTime
    await ctx.db.patch(user._id, {
      emailVerificationTime: Date.now(),
    });

    return { success: true, verified: true };
  },
});

/**
 * Debug endpoint: Verify password against stored hash
 * POST /e2e/debug-verify-password
 * Body: { email: string, password: string }
 *
 * Returns whether the password matches the stored hash.
 * Useful for debugging auth issues.
 */
export const debugVerifyPasswordEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!(email && password)) {
      return new Response(JSON.stringify({ error: "Missing email or password" }), {
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

    const result = await ctx.runMutation(internal.e2e.debugVerifyPasswordInternal, {
      email,
      password,
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
 * Internal mutation to verify password against stored hash
 */
export const debugVerifyPasswordInternal = internalMutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    accountFound: v.boolean(),
    hasStoredHash: v.boolean(),
    passwordMatches: v.optional(v.boolean()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    if (!isTestEmail(args.email)) {
      throw new Error("Only test emails allowed");
    }

    // Find the authAccount by email (providerAccountId)
    const account = await ctx.db
      .query("authAccounts")
      .filter((q) =>
        q.and(
          q.eq(q.field("provider"), "password"),
          q.eq(q.field("providerAccountId"), args.email),
        ),
      )
      .first();

    if (!account) {
      return {
        success: false,
        accountFound: false,
        hasStoredHash: false,
        error: "No password account found for this email",
      };
    }

    const storedHash = account.secret;
    if (!storedHash) {
      return {
        success: false,
        accountFound: true,
        hasStoredHash: false,
        error: "Account exists but has no password hash",
      };
    }

    // Verify the password using Scrypt (same as Convex Auth)
    const scrypt = new Scrypt();
    const passwordMatches = await scrypt.verify(storedHash, args.password);

    return {
      success: true,
      accountFound: true,
      hasStoredHash: true,
      passwordMatches,
    };
  },
});

// Legacy exports for backwards compatibility (can be removed later)
export const resetAllOnboarding = internalMutation({
  args: {},
  returns: v.object({
    deleted: v.number(),
  }),
  handler: async (ctx) => {
    // Delete all userOnboarding records for test users
    const records = await ctx.db.query("userOnboarding").collect();
    for (const record of records) {
      await ctx.db.delete(record._id);
    }
    return { deleted: records.length };
  },
});
