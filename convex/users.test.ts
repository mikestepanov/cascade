import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "./testUtils";

describe("Users", () => {
  describe("updateProfile", () => {
    it("should update user fields", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.users.updateProfile, {
        name: "Updated Name",
        bio: "New Bio",
        timezone: "Europe/London",
      });

      const user = await t.run(async (ctx) => ctx.db.get(userId));
      expect(user?.name).toBe("Updated Name");
      expect(user?.bio).toBe("New Bio");
      expect(user?.timezone).toBe("Europe/London");
    });
  });

  describe("getUserStats", () => {
    it("should count stats", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const projectId = await createTestProject(t, userId);

      // Create an issue
      const issueId = await t.run(async (ctx) => {
        return await ctx.db.insert("issues", {
          projectId,
          key: "P-1",
          title: "Task 1",
          status: "todo",
          priority: "medium",
          type: "task",
          reporterId: userId,
          assigneeId: userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          labels: [],
          order: 1,
          linkedDocuments: [],
          attachments: [],
          embedding: [],
        });
      });

      await t.run(async (ctx) => {
        await ctx.db.insert("issueComments", {
          issueId,
          authorId: userId,
          content: "Comment",
          mentions: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });

      const stats = await asUser.query(api.users.getUserStats, { userId });
      expect(stats.issuesCreated).toBe(1);
      expect(stats.issuesAssigned).toBe(1);
      expect(stats.comments).toBe(1);
    });
  });
});
