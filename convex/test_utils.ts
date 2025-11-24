/**
 * Test utilities for Convex backend tests
 *
 * This file provides helper functions for creating test data and managing test authentication.
 */

import type { TestConvex } from "convex-test";
import type { Id } from "./_generated/dataModel";
import type schema from "./schema";

type TestCtx = TestConvex<typeof schema>;

/**
 * Create a test user
 *
 * @param t - Convex test helper
 * @param userData - Optional user data
 * @returns User ID
 */
export async function createTestUser(
  t: TestCtx,
  userData?: {
    name?: string;
    email?: string;
  },
): Promise<Id<"users">> {
  return await t.run(async (ctx) => {
    const name = userData?.name || `Test User ${Date.now()}`;
    const email = userData?.email || `test${Date.now()}@example.com`;

    return await ctx.db.insert("users", {
      name,
      email,
      emailVerificationTime: Date.now(),
      image: undefined,
    });
  });
}

/**
 * Create a test project
 *
 * @param t - Convex test helper
 * @param creatorId - User ID of the project creator
 * @param projectData - Optional project data
 * @returns Project ID
 */
export async function createTestProject(
  t: TestCtx,
  creatorId: Id<"users">,
  projectData?: {
    name?: string;
    key?: string;
    description?: string;
    isPublic?: boolean;
    boardType?: "kanban" | "scrum";
  },
): Promise<Id<"projects">> {
  return await t.run(async (ctx) => {
    const now = Date.now();
    const name = projectData?.name || `Test Project ${now}`;
    const key = projectData?.key || `TEST${now.toString().slice(-6)}`;

    return await ctx.db.insert("projects", {
      name,
      key: key.toUpperCase(),
      description: projectData?.description,
      createdBy: creatorId,
      createdAt: now,
      updatedAt: now,
      isPublic: projectData?.isPublic ?? false,
      members: [], // Deprecated but still in schema
      boardType: projectData?.boardType || "kanban",
      workflowStates: [
        {
          id: "todo",
          name: "To Do",
          category: "todo" as const,
          order: 0,
        },
        {
          id: "inprogress",
          name: "In Progress",
          category: "inprogress" as const,
          order: 1,
        },
        {
          id: "done",
          name: "Done",
          category: "done" as const,
          order: 2,
        },
      ],
    });
  });
}

/**
 * Add a member to a project with a specific role
 *
 * @param t - Convex test helper
 * @param projectId - Project ID
 * @param userId - User ID to add
 * @param role - Role to assign
 * @param addedBy - User ID of the user adding the member
 * @returns Project member ID
 */
export async function addProjectMember(
  t: TestCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
  role: "admin" | "editor" | "viewer",
  addedBy: Id<"users">,
): Promise<Id<"projectMembers">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("projectMembers", {
      projectId,
      userId,
      role,
      addedBy,
      addedAt: Date.now(),
    });
  });
}

/**
 * Create a test issue
 *
 * @param t - Convex test helper
 * @param projectId - Project ID
 * @param reporterId - User ID of the reporter
 * @param issueData - Optional issue data
 * @returns Issue ID
 */
export async function createTestIssue(
  t: TestCtx,
  projectId: Id<"projects">,
  reporterId: Id<"users">,
  issueData?: {
    title?: string;
    description?: string;
    type?: "task" | "bug" | "story" | "epic";
    status?: string;
    priority?: "lowest" | "low" | "medium" | "high" | "highest";
    assigneeId?: Id<"users">;
  },
): Promise<Id<"issues">> {
  return await t.run(async (ctx) => {
    const now = Date.now();

    // Get project to construct issue key
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");

    // Count existing issues to generate key
    const issueCount = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect()
      .then((issues) => issues.length);

    const key = `${project.key}-${issueCount + 1}`;

    return await ctx.db.insert("issues", {
      projectId,
      key,
      title: issueData?.title || `Test Issue ${now}`,
      description: issueData?.description,
      type: issueData?.type || "task",
      status: issueData?.status || "todo",
      priority: issueData?.priority || "medium",
      assigneeId: issueData?.assigneeId,
      reporterId,
      createdAt: now,
      updatedAt: now,
      labels: [],
      linkedDocuments: [],
      attachments: [],
      order: issueCount,
    });
  });
}

/**
 * Helper to expect async function to throw
 *
 * @param fn - Async function to test
 * @param expectedError - Expected error message (can be partial match)
 */
export async function expectThrowsAsync(
  fn: () => Promise<unknown>,
  expectedError?: string,
): Promise<void> {
  let error: Error | undefined;
  try {
    await fn();
  } catch (e) {
    error = e as Error;
  }

  if (!error) {
    throw new Error("Expected function to throw, but it didn't");
  }

  if (expectedError && !error.message.includes(expectedError)) {
    throw new Error(
      `Expected error message to include "${expectedError}", but got: ${error.message}`,
    );
  }
}
