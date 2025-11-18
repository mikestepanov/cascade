import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { createTestProject, createTestUser } from "./test-utils";
import { modules } from "./testSetup";

describe("Webhooks", () => {
  describe("create", () => {
    it("should create a webhook with all fields", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });

      const webhookId = await t.mutation(api.webhooks.create, {
        projectId,
        name: "Issue Webhook",
        url: "https://example.com/webhook",
        events: ["issue.created", "issue.updated"],
        secret: "secret123",
      });

      expect(webhookId).toBeDefined();

      const webhook = await t.run(async (ctx) => {
        return await ctx.db.get(webhookId);
      });

      expect(webhook?.name).toBe("Issue Webhook");
      expect(webhook?.url).toBe("https://example.com/webhook");
      expect(webhook?.events).toEqual(["issue.created", "issue.updated"]);
      expect(webhook?.secret).toBe("secret123");
      expect(webhook?.isActive).toBe(true);
      expect(webhook?.createdBy).toBe(userId);
    });

    it("should create webhook without secret", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });

      const webhookId = await t.mutation(api.webhooks.create, {
        projectId,
        name: "Simple Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      const webhook = await t.run(async (ctx) => {
        return await ctx.db.get(webhookId);
      });

      expect(webhook?.secret).toBeUndefined();
    });

    it("should deny non-admin users", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const editor = await createTestUser(t, {
        name: "Editor",
        email: "editor@test.com",
      });
      const projectId = await createTestProject(t, owner);

      // Add editor
      t.withIdentity({ subject: owner });
      await t.mutation(api.projects.addMember, {
        projectId,
        userEmail: "editor@test.com",
        role: "editor",
      });

      // Editor tries to create webhook
      t.withIdentity({ subject: editor });
      await expect(async () => {
        await t.mutation(api.webhooks.create, {
          projectId,
          name: "Webhook",
          url: "https://example.com/hook",
          events: ["issue.created"],
        });
      }).rejects.toThrow();
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: undefined });
      await expect(async () => {
        await t.mutation(api.webhooks.create, {
          projectId,
          name: "Webhook",
          url: "https://example.com/hook",
          events: ["issue.created"],
        });
      }).rejects.toThrow("Not authenticated");
    });
  });

  describe("listByProject", () => {
    it("should list all webhooks for a project", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });

      // Create multiple webhooks
      await t.mutation(api.webhooks.create, {
        projectId,
        name: "Webhook 1",
        url: "https://example.com/hook1",
        events: ["issue.created"],
      });
      await t.mutation(api.webhooks.create, {
        projectId,
        name: "Webhook 2",
        url: "https://example.com/hook2",
        events: ["issue.updated"],
      });

      const webhooks = await t.query(api.webhooks.listByProject, {
        projectId,
      });

      expect(webhooks).toHaveLength(2);
      expect(webhooks.map((w) => w.name)).toContain("Webhook 1");
      expect(webhooks.map((w) => w.name)).toContain("Webhook 2");
    });

    it("should return empty array for project with no webhooks", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });

      const webhooks = await t.query(api.webhooks.listByProject, {
        projectId,
      });

      expect(webhooks).toEqual([]);
    });

    it("should deny non-admin users", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const editor = await createTestUser(t, {
        name: "Editor",
        email: "editor@test.com",
      });
      const projectId = await createTestProject(t, owner);

      // Add editor
      t.withIdentity({ subject: owner });
      await t.mutation(api.projects.addMember, {
        projectId,
        userEmail: "editor@test.com",
        role: "editor",
      });

      // Editor tries to list webhooks
      t.withIdentity({ subject: editor });
      await expect(async () => {
        await t.query(api.webhooks.listByProject, { projectId });
      }).rejects.toThrow();
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: undefined });
      await expect(async () => {
        await t.query(api.webhooks.listByProject, { projectId });
      }).rejects.toThrow("Not authenticated");
    });
  });

  describe("update", () => {
    it("should update webhook fields", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });

      const webhookId = await t.mutation(api.webhooks.create, {
        projectId,
        name: "Original Name",
        url: "https://example.com/original",
        events: ["issue.created"],
      });

      await t.mutation(api.webhooks.update, {
        id: webhookId,
        name: "Updated Name",
        url: "https://example.com/updated",
        events: ["issue.created", "issue.updated", "issue.deleted"],
      });

      const webhook = await t.run(async (ctx) => {
        return await ctx.db.get(webhookId);
      });

      expect(webhook?.name).toBe("Updated Name");
      expect(webhook?.url).toBe("https://example.com/updated");
      expect(webhook?.events).toEqual(["issue.created", "issue.updated", "issue.deleted"]);
    });

    it("should toggle isActive status", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });

      const webhookId = await t.mutation(api.webhooks.create, {
        projectId,
        name: "Test Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      // Deactivate
      await t.mutation(api.webhooks.update, {
        id: webhookId,
        isActive: false,
      });

      let webhook = await t.run(async (ctx) => {
        return await ctx.db.get(webhookId);
      });
      expect(webhook?.isActive).toBe(false);

      // Reactivate
      await t.mutation(api.webhooks.update, {
        id: webhookId,
        isActive: true,
      });

      webhook = await t.run(async (ctx) => {
        return await ctx.db.get(webhookId);
      });
      expect(webhook?.isActive).toBe(true);
    });

    it("should update only specified fields", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });

      const webhookId = await t.mutation(api.webhooks.create, {
        projectId,
        name: "Original Name",
        url: "https://example.com/original",
        events: ["issue.created"],
      });

      // Update only name
      await t.mutation(api.webhooks.update, {
        id: webhookId,
        name: "New Name",
      });

      const webhook = await t.run(async (ctx) => {
        return await ctx.db.get(webhookId);
      });

      expect(webhook?.name).toBe("New Name");
      expect(webhook?.url).toBe("https://example.com/original"); // Unchanged
    });

    it("should deny non-admin users", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const editor = await createTestUser(t, {
        name: "Editor",
        email: "editor@test.com",
      });
      const projectId = await createTestProject(t, owner);

      // Add editor
      t.withIdentity({ subject: owner });
      await t.mutation(api.projects.addMember, {
        projectId,
        userEmail: "editor@test.com",
        role: "editor",
      });

      const webhookId = await t.mutation(api.webhooks.create, {
        projectId,
        name: "Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      // Editor tries to update
      t.withIdentity({ subject: editor });
      await expect(async () => {
        await t.mutation(api.webhooks.update, {
          id: webhookId,
          name: "Hacked",
        });
      }).rejects.toThrow();
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });
      const webhookId = await t.mutation(api.webhooks.create, {
        projectId,
        name: "Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      t.withIdentity({ subject: undefined });
      await expect(async () => {
        await t.mutation(api.webhooks.update, {
          id: webhookId,
          name: "Hacked",
        });
      }).rejects.toThrow("Not authenticated");
    });

    it("should throw error for non-existent webhook", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      t.withIdentity({ subject: userId });
      const fakeId = "jh71bgkqr4n1pfdx9e1pge7e717mah8k" as Id<"webhooks">;

      await expect(async () => {
        await t.mutation(api.webhooks.update, {
          id: fakeId,
          name: "Test",
        });
      }).rejects.toThrow("Webhook not found");
    });
  });

  describe("remove", () => {
    it("should delete webhook", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });

      const webhookId = await t.mutation(api.webhooks.create, {
        projectId,
        name: "To Delete",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      await t.mutation(api.webhooks.remove, { id: webhookId });

      const webhook = await t.run(async (ctx) => {
        return await ctx.db.get(webhookId);
      });

      expect(webhook).toBeNull();
    });

    it("should deny non-admin users", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const editor = await createTestUser(t, {
        name: "Editor",
        email: "editor@test.com",
      });
      const projectId = await createTestProject(t, owner);

      // Add editor
      t.withIdentity({ subject: owner });
      await t.mutation(api.projects.addMember, {
        projectId,
        userEmail: "editor@test.com",
        role: "editor",
      });

      const webhookId = await t.mutation(api.webhooks.create, {
        projectId,
        name: "Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      // Editor tries to delete
      t.withIdentity({ subject: editor });
      await expect(async () => {
        await t.mutation(api.webhooks.remove, { id: webhookId });
      }).rejects.toThrow();
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });
      const webhookId = await t.mutation(api.webhooks.create, {
        projectId,
        name: "Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      t.withIdentity({ subject: undefined });
      await expect(async () => {
        await t.mutation(api.webhooks.remove, { id: webhookId });
      }).rejects.toThrow("Not authenticated");
    });

    it("should throw error for non-existent webhook", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      t.withIdentity({ subject: userId });
      const fakeId = "jh71bgkqr4n1pfdx9e1pge7e717mah8k" as Id<"webhooks">;

      await expect(async () => {
        await t.mutation(api.webhooks.remove, { id: fakeId });
      }).rejects.toThrow("Webhook not found");
    });
  });

  describe("listExecutions", () => {
    it("should list webhook executions", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });

      const webhookId = await t.mutation(api.webhooks.create, {
        projectId,
        name: "Test Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      // Create execution logs directly
      await t.run(async (ctx) => {
        await ctx.db.insert("webhookExecutions", {
          webhookId,
          event: "issue.created",
          requestPayload: '{"test": true}',
          status: "success",
          responseStatus: 200,
          attempts: 1,
          createdAt: Date.now(),
          completedAt: Date.now(),
        });
        await ctx.db.insert("webhookExecutions", {
          webhookId,
          event: "issue.updated",
          requestPayload: '{"test": true}',
          status: "failed",
          error: "Connection timeout",
          attempts: 1,
          createdAt: Date.now(),
          completedAt: Date.now(),
        });
      });

      const executions = await t.query(api.webhooks.listExecutions, {
        webhookId,
      });

      expect(executions).toHaveLength(2);
    });

    it("should respect limit parameter", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });

      const webhookId = await t.mutation(api.webhooks.create, {
        projectId,
        name: "Test Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      // Create multiple execution logs
      await t.run(async (ctx) => {
        for (let i = 0; i < 10; i++) {
          await ctx.db.insert("webhookExecutions", {
            webhookId,
            event: "issue.created",
            requestPayload: `{"index": ${i}}`,
            status: "success",
            attempts: 1,
            createdAt: Date.now(),
            completedAt: Date.now(),
          });
        }
      });

      const executions = await t.query(api.webhooks.listExecutions, {
        webhookId,
        limit: 5,
      });

      expect(executions.length).toBeLessThanOrEqual(5);
    });

    it("should deny non-admin users", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const editor = await createTestUser(t, {
        name: "Editor",
        email: "editor@test.com",
      });
      const projectId = await createTestProject(t, owner);

      // Add editor
      t.withIdentity({ subject: owner });
      await t.mutation(api.projects.addMember, {
        projectId,
        userEmail: "editor@test.com",
        role: "editor",
      });

      const webhookId = await t.mutation(api.webhooks.create, {
        projectId,
        name: "Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      // Editor tries to view executions
      t.withIdentity({ subject: editor });
      await expect(async () => {
        await t.query(api.webhooks.listExecutions, { webhookId });
      }).rejects.toThrow();
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });
      const webhookId = await t.mutation(api.webhooks.create, {
        projectId,
        name: "Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      t.withIdentity({ subject: undefined });
      await expect(async () => {
        await t.query(api.webhooks.listExecutions, { webhookId });
      }).rejects.toThrow("Not authenticated");
    });

    it("should throw error for non-existent webhook", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      t.withIdentity({ subject: userId });
      const fakeId = "jh71bgkqr4n1pfdx9e1pge7e717mah8k" as Id<"webhooks">;

      await expect(async () => {
        await t.query(api.webhooks.listExecutions, { webhookId: fakeId });
      }).rejects.toThrow("Webhook not found");
    });
  });

  describe("test", () => {
    it("should schedule test webhook delivery", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });

      const webhookId = await t.mutation(api.webhooks.create, {
        projectId,
        name: "Test Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      const result = await t.mutation(api.webhooks.test, { id: webhookId });

      expect(result.success).toBe(true);
    });

    it("should deny non-admin users", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const editor = await createTestUser(t, {
        name: "Editor",
        email: "editor@test.com",
      });
      const projectId = await createTestProject(t, owner);

      // Add editor
      t.withIdentity({ subject: owner });
      await t.mutation(api.projects.addMember, {
        projectId,
        userEmail: "editor@test.com",
        role: "editor",
      });

      const webhookId = await t.mutation(api.webhooks.create, {
        projectId,
        name: "Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      // Editor tries to test webhook
      t.withIdentity({ subject: editor });
      await expect(async () => {
        await t.mutation(api.webhooks.test, { id: webhookId });
      }).rejects.toThrow();
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });
      const webhookId = await t.mutation(api.webhooks.create, {
        projectId,
        name: "Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      t.withIdentity({ subject: undefined });
      await expect(async () => {
        await t.mutation(api.webhooks.test, { id: webhookId });
      }).rejects.toThrow("Not authenticated");
    });

    it("should throw error for non-existent webhook", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      t.withIdentity({ subject: userId });
      const fakeId = "jh71bgkqr4n1pfdx9e1pge7e717mah8k" as Id<"webhooks">;

      await expect(async () => {
        await t.mutation(api.webhooks.test, { id: fakeId });
      }).rejects.toThrow("Webhook not found");
    });
  });

  describe("retryExecution", () => {
    it("should schedule retry for failed execution", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });

      const webhookId = await t.mutation(api.webhooks.create, {
        projectId,
        name: "Test Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      // Create failed execution
      const executionId = await t.run(async (ctx) => {
        return await ctx.db.insert("webhookExecutions", {
          webhookId,
          event: "issue.created",
          requestPayload: '{"test": true}',
          status: "failed",
          error: "Connection timeout",
          attempts: 1,
          createdAt: Date.now(),
          completedAt: Date.now(),
        });
      });

      const result = await t.mutation(api.webhooks.retryExecution, {
        id: executionId,
      });

      expect(result.success).toBe(true);
    });

    it("should deny non-admin users", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const editor = await createTestUser(t, {
        name: "Editor",
        email: "editor@test.com",
      });
      const projectId = await createTestProject(t, owner);

      // Add editor
      t.withIdentity({ subject: owner });
      await t.mutation(api.projects.addMember, {
        projectId,
        userEmail: "editor@test.com",
        role: "editor",
      });

      const webhookId = await t.mutation(api.webhooks.create, {
        projectId,
        name: "Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      const executionId = await t.run(async (ctx) => {
        return await ctx.db.insert("webhookExecutions", {
          webhookId,
          event: "issue.created",
          requestPayload: '{"test": true}',
          status: "failed",
          attempts: 1,
          createdAt: Date.now(),
        });
      });

      // Editor tries to retry
      t.withIdentity({ subject: editor });
      await expect(async () => {
        await t.mutation(api.webhooks.retryExecution, { id: executionId });
      }).rejects.toThrow();
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });
      const webhookId = await t.mutation(api.webhooks.create, {
        projectId,
        name: "Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      const executionId = await t.run(async (ctx) => {
        return await ctx.db.insert("webhookExecutions", {
          webhookId,
          event: "issue.created",
          requestPayload: '{"test": true}',
          status: "failed",
          attempts: 1,
          createdAt: Date.now(),
        });
      });

      t.withIdentity({ subject: undefined });
      await expect(async () => {
        await t.mutation(api.webhooks.retryExecution, { id: executionId });
      }).rejects.toThrow("Not authenticated");
    });

    it("should throw error for non-existent execution", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      t.withIdentity({ subject: userId });
      const fakeId = "jh71bgkqr4n1pfdx9e1pge7e717mah8k" as Id<"webhookExecutions">;

      await expect(async () => {
        await t.mutation(api.webhooks.retryExecution, { id: fakeId });
      }).rejects.toThrow("Execution not found");
    });
  });

  describe("internal functions", () => {
    it("getActiveWebhooksForEvent - should return webhooks for specific event", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });

      // Create webhooks for different events
      await t.mutation(api.webhooks.create, {
        projectId,
        name: "Issue Webhook",
        url: "https://example.com/hook1",
        events: ["issue.created", "issue.updated"],
      });
      await t.mutation(api.webhooks.create, {
        projectId,
        name: "Comment Webhook",
        url: "https://example.com/hook2",
        events: ["comment.created"],
      });

      // Get webhooks for issue.created event
      const webhooks = await t.query(internal.webhooks.getActiveWebhooksForEvent, {
        projectId,
        event: "issue.created",
      });

      expect(webhooks).toHaveLength(1);
      expect(webhooks[0]?.name).toBe("Issue Webhook");
    });

    it("getActiveWebhooksForEvent - should only return active webhooks", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });

      // Create active webhook
      await t.mutation(api.webhooks.create, {
        projectId,
        name: "Active Webhook",
        url: "https://example.com/hook1",
        events: ["issue.created"],
      });

      // Create and deactivate webhook
      const inactiveId = await t.mutation(api.webhooks.create, {
        projectId,
        name: "Inactive Webhook",
        url: "https://example.com/hook2",
        events: ["issue.created"],
      });
      await t.mutation(api.webhooks.update, {
        id: inactiveId,
        isActive: false,
      });

      const webhooks = await t.query(internal.webhooks.getActiveWebhooksForEvent, {
        projectId,
        event: "issue.created",
      });

      expect(webhooks).toHaveLength(1);
      expect(webhooks[0]?.name).toBe("Active Webhook");
    });
  });
});
