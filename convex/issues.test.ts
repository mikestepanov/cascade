// @ts-nocheck - Test file with complex union type assertions

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "./testUtils";

describe("Issues", () => {
  describe("create", () => {
    it("should create an issue with auto-generated key", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId, {
        name: "Test Project",
        key: "ISSUE",
      });

      const asUser = asAuthenticatedUser(t, userId);
      const issueId = await asUser.mutation(api.issues.create, {
        projectId,
        title: "Test Issue",
        description: "This is a test issue",
        type: "task",
        priority: "medium",
      });

      expect(issueId).toBeDefined();

      // Verify issue was created
      const issue = await asUser.query(api.issues.get, { id: issueId });
      expect(issue?.title).toBe("Test Issue");
      expect(issue?.description).toBe("This is a test issue");
      expect(issue?.type).toBe("task");
      expect(issue?.priority).toBe("medium");
      expect(issue?.key).toBe("ISSUE-1"); // First issue in project
      expect(issue?.reporterId).toBe(userId);
    });

    it("should increment issue numbers per project", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId, { key: "AUTO" });

      const asUser = asAuthenticatedUser(t, userId);

      const issue1Id = await asUser.mutation(api.issues.create, {
        projectId,
        title: "First Issue",
        type: "task",
        priority: "medium",
      });

      const issue2Id = await asUser.mutation(api.issues.create, {
        projectId,
        title: "Second Issue",
        type: "bug",
        priority: "high",
      });

      const issue1 = await asUser.query(api.issues.get, { id: issue1Id });
      const issue2 = await asUser.query(api.issues.get, { id: issue2Id });

      expect(issue1?.key).toBe("AUTO-1");
      expect(issue2?.key).toBe("AUTO-2");
    });

    it("should set default status to first workflow state", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const issueId = await asUser.mutation(api.issues.create, {
        projectId,
        title: "Status Test",
        type: "task",
        priority: "medium",
      });

      const issue = await asUser.query(api.issues.get, { id: issueId });
      expect(issue?.status).toBe("todo"); // Default first workflow state
    });

    it("should allow setting assignee", async () => {
      const t = convexTest(schema, modules);
      const reporterId = await createTestUser(t, { name: "Reporter" });
      const assigneeId = await createTestUser(t, { name: "Assignee" });
      const projectId = await createTestProject(t, reporterId);

      const asReporter = asAuthenticatedUser(t, reporterId);
      const issueId = await asReporter.mutation(api.issues.create, {
        projectId,
        title: "Assigned Issue",
        type: "task",
        priority: "medium",
        assigneeId,
      });

      const issue = await asReporter.query(api.issues.get, { id: issueId });
      expect(issue?.assigneeId).toBe(assigneeId);
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      await expect(async () => {
        await t.mutation(api.issues.create, {
          projectId,
          title: "Unauthorized",
          type: "task",
          priority: "medium",
        });
      }).rejects.toThrow("Not authenticated");
    });

    it("should deny non-editors from creating issues", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t, { name: "Admin" });
      const viewerId = await createTestUser(t, {
        name: "Viewer",
        email: "viewer@test.com",
      });
      const projectId = await createTestProject(t, adminId);

      // Add viewer
      const asAdmin = asAuthenticatedUser(t, adminId);
      await asAdmin.mutation(api.projects.addMember, {
        projectId,
        userEmail: "viewer@test.com",
        role: "viewer",
      });

      // Try to create issue as viewer
      const asViewer = asAuthenticatedUser(t, viewerId);
      await expect(async () => {
        await asViewer.mutation(api.issues.create, {
          projectId,
          title: "Should Fail",
          type: "task",
          priority: "medium",
        });
      }).rejects.toThrow();
    });
  });

  describe("get", () => {
    it("should return issue details", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const issueId = await asUser.mutation(api.issues.create, {
        projectId,
        title: "Detailed Issue",
        description: "Detailed description",
        type: "story",
        priority: "high",
      });

      const issue = await asUser.query(api.issues.get, { id: issueId });
      expect(issue).toBeDefined();
      expect(issue?.title).toBe("Detailed Issue");
      expect(issue?.description).toBe("Detailed description");
      expect(issue?.type).toBe("story");
      expect(issue?.priority).toBe("high");
    });

    it("should return null for deleted issues", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const issueId = await asUser.mutation(api.issues.create, {
        projectId,
        title: "To Delete",
        type: "task",
        priority: "medium",
      });

      // Delete the issue using bulkDelete
      await asUser.mutation(api.issues.bulkDelete, { issueIds: [issueId] });

      const issue = await asUser.query(api.issues.get, { id: issueId });
      expect(issue).toBeNull();
    });

    it("should deny access to issues in private projects", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const outsider = await createTestUser(t, { name: "Outsider" });
      const projectId = await createTestProject(t, owner, { isPublic: false });

      const asOwner = asAuthenticatedUser(t, owner);
      const issueId = await asOwner.mutation(api.issues.create, {
        projectId,
        title: "Private Issue",
        type: "task",
        priority: "medium",
      });

      // Try to access as outsider
      const asOutsider = asAuthenticatedUser(t, outsider);
      await expect(async () => {
        await asOutsider.query(api.issues.get, { id: issueId });
      }).rejects.toThrow("Not authorized");
    });
  });

  describe("update", () => {
    it("should allow editors to update issue details", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const issueId = await asUser.mutation(api.issues.create, {
        projectId,
        title: "Original Title",
        description: "Original description",
        type: "task",
        priority: "low",
      });

      await asUser.mutation(api.issues.update, {
        issueId,
        title: "Updated Title",
        description: "Updated description",
        priority: "high",
      });

      const issue = await asUser.query(api.issues.get, { id: issueId });
      expect(issue?.title).toBe("Updated Title");
      expect(issue?.description).toBe("Updated description");
      expect(issue?.priority).toBe("high");
    });

    it("should deny viewers from updating issues", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t, { name: "Admin" });
      const viewerId = await createTestUser(t, {
        name: "Viewer",
        email: "viewer@test.com",
      });
      const projectId = await createTestProject(t, adminId);

      const asAdmin = asAuthenticatedUser(t, adminId);
      const issueId = await asAdmin.mutation(api.issues.create, {
        projectId,
        title: "Test Issue",
        type: "task",
        priority: "medium",
      });

      await asAdmin.mutation(api.projects.addMember, {
        projectId,
        userEmail: "viewer@test.com",
        role: "viewer",
      });

      // Try to update as viewer
      const asViewer = asAuthenticatedUser(t, viewerId);
      await expect(async () => {
        await asViewer.mutation(api.issues.update, {
          issueId,
          title: "Updated by viewer",
        });
      }).rejects.toThrow();
    });
  });

  describe("updateStatus", () => {
    it("should update issue status and log activity", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const issueId = await asUser.mutation(api.issues.create, {
        projectId,
        title: "Status Test",
        type: "task",
        priority: "medium",
      });

      await asUser.mutation(api.issues.updateStatus, {
        issueId,
        newStatus: "inprogress",
        newOrder: 0,
      });

      const issue = await asUser.query(api.issues.get, { id: issueId });
      expect(issue?.status).toBe("inprogress");

      // Verify activity was logged
      const activities = await t.run(async (ctx) => {
        return await ctx.db
          .query("issueActivity")
          .withIndex("by_issue", (q) => q.eq("issueId", issueId))
          .collect();
      });

      const statusChange = activities.find((a) => a.field === "status");
      expect(statusChange).toBeDefined();
      expect(statusChange?.oldValue).toBe("todo");
      expect(statusChange?.newValue).toBe("inprogress");
    });

    it("should allow updating status to any value", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const issueId = await asUser.mutation(api.issues.create, {
        projectId,
        title: "Test",
        type: "task",
        priority: "medium",
      });

      // Implementation accepts any status value (no workflow validation)
      await asUser.mutation(api.issues.updateStatus, {
        issueId,
        newStatus: "custom_status",
        newOrder: 0,
      });

      const issue = await asUser.query(api.issues.get, { id: issueId });
      expect(issue?.status).toBe("custom_status");
    });
  });

  describe("listByProject", () => {
    it("should return all issues in a project", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      await asUser.mutation(api.issues.create, {
        projectId,
        title: "Issue 1",
        type: "task",
        priority: "medium",
      });
      await asUser.mutation(api.issues.create, {
        projectId,
        title: "Issue 2",
        type: "bug",
        priority: "high",
      });
      await asUser.mutation(api.issues.create, {
        projectId,
        title: "Issue 3",
        type: "story",
        priority: "low",
      });

      const issues = await asUser.query(api.issues.listByProject, { projectId });
      expect(issues).toHaveLength(3);
      expect(issues.map((i) => i.title)).toContain("Issue 1");
      expect(issues.map((i) => i.title)).toContain("Issue 2");
      expect(issues.map((i) => i.title)).toContain("Issue 3");
    });

    it("should return empty array for projects with no issues", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const issues = await asUser.query(api.issues.listByProject, { projectId });
      expect(issues).toEqual([]);
    });
  });

  describe("addComment", () => {
    it("should add a comment to an issue", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, { name: "Commenter" });
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const issueId = await asUser.mutation(api.issues.create, {
        projectId,
        title: "Test Issue",
        type: "task",
        priority: "medium",
      });

      const commentId = await asUser.mutation(api.issues.addComment, {
        issueId,
        content: "This is a test comment",
      });

      expect(commentId).toBeDefined();

      // Verify comment was added
      const comments = await t.run(async (ctx) => {
        return await ctx.db
          .query("issueComments")
          .withIndex("by_issue", (q) => q.eq("issueId", issueId))
          .collect();
      });

      expect(comments).toHaveLength(1);
      expect(comments[0].content).toBe("This is a test comment");
      expect(comments[0].authorId).toBe(userId);
    });

    it("should deny unauthenticated users from commenting", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const issueId = await asUser.mutation(api.issues.create, {
        projectId,
        title: "Test",
        type: "task",
        priority: "medium",
      });

      // Call without authentication
      await expect(async () => {
        await t.mutation(api.issues.addComment, {
          issueId,
          content: "Unauthorized comment",
        });
      }).rejects.toThrow("Not authenticated");
    });
  });

  describe("bulk operations", () => {
    it("should bulk update status for multiple issues", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const issue1Id = await asUser.mutation(api.issues.create, {
        projectId,
        title: "Issue 1",
        type: "task",
        priority: "medium",
      });
      const issue2Id = await asUser.mutation(api.issues.create, {
        projectId,
        title: "Issue 2",
        type: "task",
        priority: "medium",
      });

      await asUser.mutation(api.issues.bulkUpdateStatus, {
        issueIds: [issue1Id, issue2Id],
        newStatus: "done",
      });

      const issue1 = await asUser.query(api.issues.get, { id: issue1Id });
      const issue2 = await asUser.query(api.issues.get, { id: issue2Id });

      expect(issue1?.status).toBe("done");
      expect(issue2?.status).toBe("done");
    });

    it("should bulk update priority", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const issue1Id = await asUser.mutation(api.issues.create, {
        projectId,
        title: "Issue 1",
        type: "task",
        priority: "low",
      });
      const issue2Id = await asUser.mutation(api.issues.create, {
        projectId,
        title: "Issue 2",
        type: "task",
        priority: "medium",
      });

      await asUser.mutation(api.issues.bulkUpdatePriority, {
        issueIds: [issue1Id, issue2Id],
        priority: "highest",
      });

      const issue1 = await asUser.query(api.issues.get, { id: issue1Id });
      const issue2 = await asUser.query(api.issues.get, { id: issue2Id });

      expect(issue1?.priority).toBe("highest");
      expect(issue2?.priority).toBe("highest");
    });

    it("should bulk assign issues to a user", async () => {
      const t = convexTest(schema, modules);
      const reporterId = await createTestUser(t, { name: "Reporter" });
      const assigneeId = await createTestUser(t, { name: "Assignee" });
      const projectId = await createTestProject(t, reporterId);

      const asReporter = asAuthenticatedUser(t, reporterId);
      const issue1Id = await asReporter.mutation(api.issues.create, {
        projectId,
        title: "Issue 1",
        type: "task",
        priority: "medium",
      });
      const issue2Id = await asReporter.mutation(api.issues.create, {
        projectId,
        title: "Issue 2",
        type: "task",
        priority: "medium",
      });

      await asReporter.mutation(api.issues.bulkAssign, {
        issueIds: [issue1Id, issue2Id],
        assigneeId,
      });

      const issue1 = await asReporter.query(api.issues.get, { id: issue1Id });
      const issue2 = await asReporter.query(api.issues.get, { id: issue2Id });

      expect(issue1?.assigneeId).toBe(assigneeId);
      expect(issue2?.assigneeId).toBe(assigneeId);
    });

    it("should skip issues for non-editors in bulk operations", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t, { name: "Admin" });
      const viewerId = await createTestUser(t, {
        name: "Viewer",
        email: "viewer@test.com",
      });
      const projectId = await createTestProject(t, adminId);

      const asAdmin = asAuthenticatedUser(t, adminId);
      const issueId = await asAdmin.mutation(api.issues.create, {
        projectId,
        title: "Test",
        type: "task",
        priority: "medium",
      });

      await asAdmin.mutation(api.projects.addMember, {
        projectId,
        userEmail: "viewer@test.com",
        role: "viewer",
      });

      // Bulk operations silently skip issues the user can't edit
      const asViewer = asAuthenticatedUser(t, viewerId);
      const result = await asViewer.mutation(api.issues.bulkUpdateStatus, {
        issueIds: [issueId],
        newStatus: "done",
      });

      // Should return 0 updated since viewer lacks permission
      expect(result.updated).toBe(0);

      // Issue should remain unchanged
      const issue = await asAdmin.query(api.issues.get, { id: issueId });
      expect(issue?.status).toBe("todo");
    });
  });

  describe("search", () => {
    it("should search issues by title", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      await asUser.mutation(api.issues.create, {
        projectId,
        title: "Fix login bug",
        type: "bug",
        priority: "high",
      });
      await asUser.mutation(api.issues.create, {
        projectId,
        title: "Add login feature",
        type: "story",
        priority: "medium",
      });
      await asUser.mutation(api.issues.create, {
        projectId,
        title: "Update dashboard",
        type: "task",
        priority: "low",
      });

      const searchResult = await asUser.query(api.issues.search, {
        query: "login",
      });

      expect(searchResult.results).toHaveLength(2);
      expect(searchResult.results.map((i) => i.title)).toContain("Fix login bug");
      expect(searchResult.results.map((i) => i.title)).toContain("Add login feature");
    });
  });
});
