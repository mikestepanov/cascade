import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { createTestProject, createTestUser } from "./test-utils";
import { modules } from "./testSetup";

describe("Issues", () => {
  describe("create", () => {
    it("should create an issue with auto-generated key", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId, {
        name: "Test Project",
        key: "ISSUE",
      });

      t.withIdentity({ subject: userId });
      const issueId = await t.mutation(api.issues.create, {
        projectId,
        title: "Test Issue",
        description: "This is a test issue",
        type: "task",
        priority: "medium",
      });

      expect(issueId).toBeDefined();

      // Verify issue was created
      const issue = await t.query(api.issues.get, { id: issueId });
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

      t.withIdentity({ subject: userId });

      const issue1Id = await t.mutation(api.issues.create, {
        projectId,
        title: "First Issue",
        type: "task",
        priority: "medium",
      });

      const issue2Id = await t.mutation(api.issues.create, {
        projectId,
        title: "Second Issue",
        type: "bug",
        priority: "high",
      });

      const issue1 = await t.query(api.issues.get, { id: issue1Id });
      const issue2 = await t.query(api.issues.get, { id: issue2Id });

      expect(issue1?.key).toBe("AUTO-1");
      expect(issue2?.key).toBe("AUTO-2");
    });

    it("should set default status to first workflow state", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });
      const issueId = await t.mutation(api.issues.create, {
        projectId,
        title: "Status Test",
        type: "task",
        priority: "medium",
      });

      const issue = await t.query(api.issues.get, { id: issueId });
      expect(issue?.status).toBe("todo"); // Default first workflow state
    });

    it("should allow setting assignee", async () => {
      const t = convexTest(schema, modules);
      const reporterId = await createTestUser(t, { name: "Reporter" });
      const assigneeId = await createTestUser(t, { name: "Assignee" });
      const projectId = await createTestProject(t, reporterId);

      t.withIdentity({ subject: reporterId });
      const issueId = await t.mutation(api.issues.create, {
        projectId,
        title: "Assigned Issue",
        type: "task",
        priority: "medium",
        assigneeId,
      });

      const issue = await t.query(api.issues.get, { id: issueId });
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
      t.withIdentity({ subject: adminId });
      await t.mutation(api.projects.addMember, {
        projectId,
        userEmail: "viewer@test.com",
        role: "viewer",
      });

      // Try to create issue as viewer
      t.withIdentity({ subject: viewerId });
      await expect(async () => {
        await t.mutation(api.issues.create, {
          projectId,
          title: "Should Fail",
          type: "task",
          priority: "medium",
        });
      }).rejects.toThrow("Insufficient permissions");
    });
  });

  describe("get", () => {
    it("should return issue details", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });
      const issueId = await t.mutation(api.issues.create, {
        projectId,
        title: "Detailed Issue",
        description: "Detailed description",
        type: "story",
        priority: "high",
      });

      const issue = await t.query(api.issues.get, { id: issueId });
      expect(issue).toBeDefined();
      expect(issue?.title).toBe("Detailed Issue");
      expect(issue?.description).toBe("Detailed description");
      expect(issue?.type).toBe("story");
      expect(issue?.priority).toBe("high");
    });

    it("should return null for non-existent issues", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      t.withIdentity({ subject: userId });

      const fakeId = "jh71bgkqr4n1pfdx9e1pge7e717mah8k" as Id<"issues">;
      const issue = await t.query(api.issues.get, { id: fakeId });
      expect(issue).toBeNull();
    });

    it("should deny access to issues in private projects", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const outsider = await createTestUser(t, { name: "Outsider" });
      const projectId = await createTestProject(t, owner, { isPublic: false });

      t.withIdentity({ subject: owner });
      const issueId = await t.mutation(api.issues.create, {
        projectId,
        title: "Private Issue",
        type: "task",
        priority: "medium",
      });

      // Try to access as outsider
      t.withIdentity({ subject: outsider });
      await expect(async () => {
        await t.query(api.issues.get, { id: issueId });
      }).rejects.toThrow("Not authorized");
    });
  });

  describe("update", () => {
    it("should allow editors to update issue details", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });
      const issueId = await t.mutation(api.issues.create, {
        projectId,
        title: "Original Title",
        description: "Original description",
        type: "task",
        priority: "low",
      });

      await t.mutation(api.issues.update, {
        issueId,
        title: "Updated Title",
        description: "Updated description",
        priority: "high",
      });

      const issue = await t.query(api.issues.get, { id: issueId });
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

      t.withIdentity({ subject: adminId });
      const issueId = await t.mutation(api.issues.create, {
        projectId,
        title: "Test Issue",
        type: "task",
        priority: "medium",
      });

      await t.mutation(api.projects.addMember, {
        projectId,
        userEmail: "viewer@test.com",
        role: "viewer",
      });

      // Try to update as viewer
      t.withIdentity({ subject: viewerId });
      await expect(async () => {
        await t.mutation(api.issues.update, {
          issueId,
          title: "Updated by viewer",
        });
      }).rejects.toThrow("Insufficient permissions");
    });
  });

  describe("updateStatus", () => {
    it("should update issue status and log activity", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });
      const issueId = await t.mutation(api.issues.create, {
        projectId,
        title: "Status Test",
        type: "task",
        priority: "medium",
      });

      await t.mutation(api.issues.updateStatus, {
        issueId,
        newStatus: "inprogress",
        newOrder: 0,
      });

      const issue = await t.query(api.issues.get, { id: issueId });
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

    it("should validate status against workflow states", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });
      const issueId = await t.mutation(api.issues.create, {
        projectId,
        title: "Test",
        type: "task",
        priority: "medium",
      });

      // Try to set invalid status
      await expect(async () => {
        await t.mutation(api.issues.updateStatus, {
          issueId,
          newStatus: "invalid_status",
          newOrder: 0,
        });
      }).rejects.toThrow();
    });
  });

  describe("listByProject", () => {
    it("should return all issues in a project", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });
      await t.mutation(api.issues.create, {
        projectId,
        title: "Issue 1",
        type: "task",
        priority: "medium",
      });
      await t.mutation(api.issues.create, {
        projectId,
        title: "Issue 2",
        type: "bug",
        priority: "high",
      });
      await t.mutation(api.issues.create, {
        projectId,
        title: "Issue 3",
        type: "story",
        priority: "low",
      });

      const issues = await t.query(api.issues.listByProject, { projectId });
      expect(issues).toHaveLength(3);
      expect(issues.map((i) => i.title)).toContain("Issue 1");
      expect(issues.map((i) => i.title)).toContain("Issue 2");
      expect(issues.map((i) => i.title)).toContain("Issue 3");
    });

    it("should return empty array for projects with no issues", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });
      const issues = await t.query(api.issues.listByProject, { projectId });
      expect(issues).toEqual([]);
    });
  });

  describe("addComment", () => {
    it("should add a comment to an issue", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, { name: "Commenter" });
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });
      const issueId = await t.mutation(api.issues.create, {
        projectId,
        title: "Test Issue",
        type: "task",
        priority: "medium",
      });

      const commentId = await t.mutation(api.issues.addComment, {
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

      t.withIdentity({ subject: userId });
      const issueId = await t.mutation(api.issues.create, {
        projectId,
        title: "Test",
        type: "task",
        priority: "medium",
      });

      t.withIdentity({ subject: undefined });
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

      t.withIdentity({ subject: userId });
      const issue1Id = await t.mutation(api.issues.create, {
        projectId,
        title: "Issue 1",
        type: "task",
        priority: "medium",
      });
      const issue2Id = await t.mutation(api.issues.create, {
        projectId,
        title: "Issue 2",
        type: "task",
        priority: "medium",
      });

      await t.mutation(api.issues.bulkUpdateStatus, {
        issueIds: [issue1Id, issue2Id],
        newStatus: "done",
      });

      const issue1 = await t.query(api.issues.get, { id: issue1Id });
      const issue2 = await t.query(api.issues.get, { id: issue2Id });

      expect(issue1?.status).toBe("done");
      expect(issue2?.status).toBe("done");
    });

    it("should bulk update priority", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });
      const issue1Id = await t.mutation(api.issues.create, {
        projectId,
        title: "Issue 1",
        type: "task",
        priority: "low",
      });
      const issue2Id = await t.mutation(api.issues.create, {
        projectId,
        title: "Issue 2",
        type: "task",
        priority: "medium",
      });

      await t.mutation(api.issues.bulkUpdatePriority, {
        issueIds: [issue1Id, issue2Id],
        priority: "highest",
      });

      const issue1 = await t.query(api.issues.get, { id: issue1Id });
      const issue2 = await t.query(api.issues.get, { id: issue2Id });

      expect(issue1?.priority).toBe("highest");
      expect(issue2?.priority).toBe("highest");
    });

    it("should bulk assign issues to a user", async () => {
      const t = convexTest(schema, modules);
      const reporterId = await createTestUser(t, { name: "Reporter" });
      const assigneeId = await createTestUser(t, { name: "Assignee" });
      const projectId = await createTestProject(t, reporterId);

      t.withIdentity({ subject: reporterId });
      const issue1Id = await t.mutation(api.issues.create, {
        projectId,
        title: "Issue 1",
        type: "task",
        priority: "medium",
      });
      const issue2Id = await t.mutation(api.issues.create, {
        projectId,
        title: "Issue 2",
        type: "task",
        priority: "medium",
      });

      await t.mutation(api.issues.bulkAssign, {
        issueIds: [issue1Id, issue2Id],
        assigneeId,
      });

      const issue1 = await t.query(api.issues.get, { id: issue1Id });
      const issue2 = await t.query(api.issues.get, { id: issue2Id });

      expect(issue1?.assigneeId).toBe(assigneeId);
      expect(issue2?.assigneeId).toBe(assigneeId);
    });

    it("should deny bulk operations for non-editors", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t, { name: "Admin" });
      const viewerId = await createTestUser(t, {
        name: "Viewer",
        email: "viewer@test.com",
      });
      const projectId = await createTestProject(t, adminId);

      t.withIdentity({ subject: adminId });
      const issueId = await t.mutation(api.issues.create, {
        projectId,
        title: "Test",
        type: "task",
        priority: "medium",
      });

      await t.mutation(api.projects.addMember, {
        projectId,
        userEmail: "viewer@test.com",
        role: "viewer",
      });

      t.withIdentity({ subject: viewerId });
      await expect(async () => {
        await t.mutation(api.issues.bulkUpdateStatus, {
          issueIds: [issueId],
          newStatus: "done",
        });
      }).rejects.toThrow("Insufficient permissions");
    });
  });

  describe("search", () => {
    it("should search issues by title", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });
      await t.mutation(api.issues.create, {
        projectId,
        title: "Fix login bug",
        type: "bug",
        priority: "high",
      });
      await t.mutation(api.issues.create, {
        projectId,
        title: "Add login feature",
        type: "story",
        priority: "medium",
      });
      await t.mutation(api.issues.create, {
        projectId,
        title: "Update dashboard",
        type: "task",
        priority: "low",
      });

      const searchResult = await t.query(api.issues.search, {
        query: "login",
      });

      expect(searchResult.results).toHaveLength(2);
      expect(searchResult.results.map((i) => i.title)).toContain("Fix login bug");
      expect(searchResult.results.map((i) => i.title)).toContain("Add login feature");
    });
  });
});
