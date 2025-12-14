import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "../_generated/api";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createTestProject, createTestUser } from "../testUtils";

describe("Internal AI", () => {
  describe("createChat", () => {
    it("should create a new chat for a user", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const workspaceId = await createTestProject(t, userId);

      const chatId = await t.mutation(internal.internal.ai.createChat, {
        userId,
        workspaceId,
        title: "Test Chat",
      });

      const chat = await t.run(async (ctx) => ctx.db.get(chatId));
      expect(chat?.title).toBe("Test Chat");
      expect(chat?.userId).toBe(userId);
      expect(chat?.workspaceId).toBe(workspaceId);
    });

    it("should throw if user not found", async () => {
      const t = convexTest(schema, modules);
      // Generate a fake ID that looks like a user ID but doesn't exist?
      // Actually internal.ai.createChat takes a string userId which is expected to match _id.
      // But it queries by string equality on _id.

      // Let's just pass a random string that won't match any user
      await expect(async () => {
        await t.mutation(internal.internal.ai.createChat, {
          userId: "non-existent-user",
          title: "Fail Chat",
        });
      }).rejects.toThrow("User not found");
    });
  });

  describe("addMessage", () => {
    it("should add a message to the chat", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const chatId = await t.mutation(internal.internal.ai.createChat, {
        userId,
        title: "Chat",
      });

      await t.mutation(internal.internal.ai.addMessage, {
        chatId,
        role: "user",
        content: "Hello AI",
      });

      // Verify message added
      const messages = await t.run(async (ctx) =>
        ctx.db
          .query("aiMessages")
          .withIndex("by_chat", (q) => q.eq("chatId", chatId))
          .collect(),
      );
      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe("Hello AI");
      expect(messages[0].role).toBe("user");

      // Verify chat updated
      const chat = await t.run(async (ctx) => ctx.db.get(chatId));
      // check if updatedAt is recent? difficult to check exact time, but we can check existence
      expect(chat?.updatedAt).toBeDefined();
    });
  });

  describe("getProjectContext", () => {
    it("should generate context string", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const workspaceId = await createTestProject(t, userId, {
        name: "Context Project",
        key: "CTX",
      });

      // Create some issues (comment updated to reflect below actions)
      // Note: getProjectContext is a query but defined as internalQuery, so we use t.query?
      // wait, internal/ai.ts exports getProjectContext as internalQuery.
      // convex-test t.query can run internal queries.

      // Add an active sprint
      const sprintId = await t.run(async (ctx) => {
        return await ctx.db.insert("sprints", {
          workspaceId,
          name: "Active Sprint",
          status: "active",
          createdBy: userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });

      // Add issues
      await t.run(async (ctx) => {
        await ctx.db.insert("issues", {
          workspaceId,
          key: "CTX-1",
          title: "Task 1",
          status: "todo",
          type: "task",
          priority: "medium",
          reporterId: userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          labels: [],
          linkedDocuments: [],
          attachments: [],
          order: 1,
        });
        await ctx.db.insert("issues", {
          workspaceId,
          key: "CTX-2",
          title: "Task 2",
          status: "done",
          type: "task",
          priority: "medium",
          reporterId: userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          labels: [],
          linkedDocuments: [],
          attachments: [],
          order: 2,
        });
      });

      const context = await t.query(internal.internal.ai.getProjectContext, { workspaceId });

      expect(context).toContain("Project: Context Project (CTX)");
      expect(context).toContain("Active Sprint: Active Sprint");
      expect(context).toContain("Total Issues: 2");
      expect(context).toContain("todo: 1");
      expect(context).toContain("done: 1");
    });

    it("should handle empty project", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const workspaceId = await createTestProject(t, userId);

      const context = await t.query(internal.internal.ai.getProjectContext, { workspaceId });
      expect(context).toContain("Active Sprint: None");
      expect(context).toContain("Total Issues: 0");
    });
  });
});
