import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { createTestUser } from "./test-utils";
import { modules } from "./testSetup";

describe("Notifications", () => {
  describe("list", () => {
    it("should return notifications for authenticated user", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const actorId = await createTestUser(t, { name: "Actor" });

      // Create a notification directly
      await t.run(async (ctx) => {
        await ctx.db.insert("notifications", {
          userId,
          type: "issue_assigned",
          title: "Issue assigned to you",
          message: "You have been assigned to a new issue",
          isRead: false,
          actorId,
          createdAt: Date.now(),
        });
      });

      t.withIdentity({ subject: userId });
      const notifications = await t.query(api.notifications.list, {});

      expect(notifications).toHaveLength(1);
      expect(notifications[0]?.type).toBe("issue_assigned");
      expect(notifications[0]?.actorName).toBeDefined();
    });

    it("should respect limit parameter", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Create multiple notifications
      await t.run(async (ctx) => {
        for (let i = 0; i < 10; i++) {
          await ctx.db.insert("notifications", {
            userId,
            type: "test",
            title: `Notification ${i}`,
            message: "Test notification",
            isRead: false,
            createdAt: Date.now(),
          });
        }
      });

      t.withIdentity({ subject: userId });
      const notifications = await t.query(api.notifications.list, {
        limit: 5,
      });

      expect(notifications.length).toBeLessThanOrEqual(5);
    });

    it("should filter unread notifications when onlyUnread is true", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Create read and unread notifications
      await t.run(async (ctx) => {
        await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: "Unread 1",
          message: "Test",
          isRead: false,
          createdAt: Date.now(),
        });
        await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: "Read 1",
          message: "Test",
          isRead: true,
          createdAt: Date.now(),
        });
        await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: "Unread 2",
          message: "Test",
          isRead: false,
          createdAt: Date.now(),
        });
      });

      t.withIdentity({ subject: userId });
      const unreadNotifications = await t.query(api.notifications.list, {
        onlyUnread: true,
      });

      expect(unreadNotifications).toHaveLength(2);
      expect(unreadNotifications.every((n) => !n.isRead)).toBe(true);
    });

    it("should return all notifications when onlyUnread is false", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      await t.run(async (ctx) => {
        await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: "Unread",
          message: "Test",
          isRead: false,
          createdAt: Date.now(),
        });
        await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: "Read",
          message: "Test",
          isRead: true,
          createdAt: Date.now(),
        });
      });

      t.withIdentity({ subject: userId });
      const allNotifications = await t.query(api.notifications.list, {
        onlyUnread: false,
      });

      expect(allNotifications).toHaveLength(2);
    });

    it("should return empty array for user with no notifications", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      t.withIdentity({ subject: userId });
      const notifications = await t.query(api.notifications.list, {});

      expect(notifications).toEqual([]);
    });

    it("should only return notifications for current user", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });

      // Create notifications for both users
      await t.run(async (ctx) => {
        await ctx.db.insert("notifications", {
          userId: user1,
          type: "test",
          title: "For User 1",
          message: "Test",
          isRead: false,
          createdAt: Date.now(),
        });
        await ctx.db.insert("notifications", {
          userId: user2,
          type: "test",
          title: "For User 2",
          message: "Test",
          isRead: false,
          createdAt: Date.now(),
        });
      });

      // User 1 queries notifications
      t.withIdentity({ subject: user1 });
      const user1Notifications = await t.query(api.notifications.list, {});

      expect(user1Notifications).toHaveLength(1);
      expect(user1Notifications[0]?.title).toBe("For User 1");
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      t.withIdentity({ subject: undefined });
      await expect(async () => {
        await t.query(api.notifications.list, {});
      }).rejects.toThrow("Not authenticated");
    });
  });

  describe("getUnreadCount", () => {
    it("should return count of unread notifications", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Create unread notifications
      await t.run(async (ctx) => {
        for (let i = 0; i < 3; i++) {
          await ctx.db.insert("notifications", {
            userId,
            type: "test",
            title: `Unread ${i}`,
            message: "Test",
            isRead: false,
            createdAt: Date.now(),
          });
        }
        // Create read notification
        await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: "Read",
          message: "Test",
          isRead: true,
          createdAt: Date.now(),
        });
      });

      t.withIdentity({ subject: userId });
      const count = await t.query(api.notifications.getUnreadCount, {});

      expect(count).toBe(3);
    });

    it("should return zero for user with no notifications", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      t.withIdentity({ subject: userId });
      const count = await t.query(api.notifications.getUnreadCount, {});

      expect(count).toBe(0);
    });

    it("should return zero for unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      t.withIdentity({ subject: undefined });
      const count = await t.query(api.notifications.getUnreadCount, {});

      expect(count).toBe(0);
    });
  });

  describe("markAsRead", () => {
    it("should mark notification as read", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Create unread notification
      const notificationId = await t.run(async (ctx) => {
        return await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: "Test",
          message: "Test notification",
          isRead: false,
          createdAt: Date.now(),
        });
      });

      t.withIdentity({ subject: userId });
      await t.mutation(api.notifications.markAsRead, { id: notificationId });

      const notification = await t.run(async (ctx) => {
        return await ctx.db.get(notificationId);
      });

      expect(notification?.isRead).toBe(true);
    });

    it("should deny marking other user's notification as read", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });

      // Create notification for user1
      const notificationId = await t.run(async (ctx) => {
        return await ctx.db.insert("notifications", {
          userId: user1,
          type: "test",
          title: "Test",
          message: "Test",
          isRead: false,
          createdAt: Date.now(),
        });
      });

      // User2 tries to mark it as read
      t.withIdentity({ subject: user2 });
      await expect(async () => {
        await t.mutation(api.notifications.markAsRead, { id: notificationId });
      }).rejects.toThrow("Not authorized");
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const notificationId = await t.run(async (ctx) => {
        return await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: "Test",
          message: "Test",
          isRead: false,
          createdAt: Date.now(),
        });
      });

      t.withIdentity({ subject: undefined });
      await expect(async () => {
        await t.mutation(api.notifications.markAsRead, { id: notificationId });
      }).rejects.toThrow("Not authenticated");
    });

    it("should throw error for non-existent notification", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      t.withIdentity({ subject: userId });
      const fakeId = "jh71bgkqr4n1pfdx9e1pge7e717mah8k" as Id<"notifications">;

      await expect(async () => {
        await t.mutation(api.notifications.markAsRead, { id: fakeId });
      }).rejects.toThrow("Notification not found");
    });
  });

  describe("markAllAsRead", () => {
    it("should mark all unread notifications as read", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Create multiple unread notifications
      await t.run(async (ctx) => {
        for (let i = 0; i < 3; i++) {
          await ctx.db.insert("notifications", {
            userId,
            type: "test",
            title: `Test ${i}`,
            message: "Test",
            isRead: false,
            createdAt: Date.now(),
          });
        }
      });

      t.withIdentity({ subject: userId });
      await t.mutation(api.notifications.markAllAsRead, {});

      const unreadCount = await t.query(api.notifications.getUnreadCount, {});

      expect(unreadCount).toBe(0);
    });

    it("should not affect already read notifications", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Create read and unread notifications
      await t.run(async (ctx) => {
        await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: "Read",
          message: "Test",
          isRead: true,
          createdAt: Date.now(),
        });
        await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: "Unread",
          message: "Test",
          isRead: false,
          createdAt: Date.now(),
        });
      });

      t.withIdentity({ subject: userId });
      await t.mutation(api.notifications.markAllAsRead, {});

      const allNotifications = await t.query(api.notifications.list, {});

      expect(allNotifications).toHaveLength(2);
      expect(allNotifications.every((n) => n.isRead)).toBe(true);
    });

    it("should only mark current user's notifications", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });

      // Create unread notifications for both users
      await t.run(async (ctx) => {
        await ctx.db.insert("notifications", {
          userId: user1,
          type: "test",
          title: "User 1 notification",
          message: "Test",
          isRead: false,
          createdAt: Date.now(),
        });
        await ctx.db.insert("notifications", {
          userId: user2,
          type: "test",
          title: "User 2 notification",
          message: "Test",
          isRead: false,
          createdAt: Date.now(),
        });
      });

      // User 1 marks all as read
      t.withIdentity({ subject: user1 });
      await t.mutation(api.notifications.markAllAsRead, {});

      // User 2's notification should still be unread
      t.withIdentity({ subject: user2 });
      const user2UnreadCount = await t.query(api.notifications.getUnreadCount, {});

      expect(user2UnreadCount).toBe(1);
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      t.withIdentity({ subject: undefined });
      await expect(async () => {
        await t.mutation(api.notifications.markAllAsRead, {});
      }).rejects.toThrow("Not authenticated");
    });
  });

  describe("remove", () => {
    it("should delete notification", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Create notification
      const notificationId = await t.run(async (ctx) => {
        return await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: "Test",
          message: "Test notification",
          isRead: false,
          createdAt: Date.now(),
        });
      });

      t.withIdentity({ subject: userId });
      await t.mutation(api.notifications.remove, { id: notificationId });

      const notification = await t.run(async (ctx) => {
        return await ctx.db.get(notificationId);
      });

      expect(notification).toBeNull();
    });

    it("should deny deleting other user's notification", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });

      // Create notification for user1
      const notificationId = await t.run(async (ctx) => {
        return await ctx.db.insert("notifications", {
          userId: user1,
          type: "test",
          title: "Test",
          message: "Test",
          isRead: false,
          createdAt: Date.now(),
        });
      });

      // User2 tries to delete it
      t.withIdentity({ subject: user2 });
      await expect(async () => {
        await t.mutation(api.notifications.remove, { id: notificationId });
      }).rejects.toThrow("Not authorized");
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const notificationId = await t.run(async (ctx) => {
        return await ctx.db.insert("notifications", {
          userId,
          type: "test",
          title: "Test",
          message: "Test",
          isRead: false,
          createdAt: Date.now(),
        });
      });

      t.withIdentity({ subject: undefined });
      await expect(async () => {
        await t.mutation(api.notifications.remove, { id: notificationId });
      }).rejects.toThrow("Not authenticated");
    });

    it("should throw error for non-existent notification", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      t.withIdentity({ subject: userId });
      const fakeId = "jh71bgkqr4n1pfdx9e1pge7e717mah8k" as Id<"notifications">;

      await expect(async () => {
        await t.mutation(api.notifications.remove, { id: fakeId });
      }).rejects.toThrow("Notification not found");
    });
  });

  describe("internal mutations", () => {
    it("create - should create a notification", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const actorId = await createTestUser(t, { name: "Actor" });

      // Call internal mutation directly
      await t.run(async (ctx) => {
        const { create } = await import("./notifications");
        await create(ctx, {
          userId,
          type: "issue_assigned",
          title: "Issue assigned",
          message: "You have been assigned to an issue",
          actorId,
        });
      });

      // Verify notification was created
      t.withIdentity({ subject: userId });
      const notifications = await t.query(api.notifications.list, {});

      expect(notifications).toHaveLength(1);
      expect(notifications[0]?.type).toBe("issue_assigned");
      expect(notifications[0]?.actorId).toBe(actorId);
    });

    it("create - should not create notification if user is actor", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Call internal mutation with userId === actorId
      await t.run(async (ctx) => {
        const { create } = await import("./notifications");
        await create(ctx, {
          userId,
          type: "test",
          title: "Test",
          message: "Test",
          actorId: userId,
        });
      });

      // Verify no notification was created
      t.withIdentity({ subject: userId });
      const notifications = await t.query(api.notifications.list, {});

      expect(notifications).toHaveLength(0);
    });

    it("createBulk - should create notifications for multiple users", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });
      const user3 = await createTestUser(t, { name: "User 3" });
      const actor = await createTestUser(t, { name: "Actor" });

      // Call internal bulk mutation
      await t.run(async (ctx) => {
        const { createBulk } = await import("./notifications");
        await createBulk(ctx, {
          userIds: [user1, user2, user3],
          type: "project_update",
          title: "Project updated",
          message: "The project has been updated",
          actorId: actor,
        });
      });

      // Verify all users got notifications
      t.withIdentity({ subject: user1 });
      const user1Notifications = await t.query(api.notifications.list, {});
      expect(user1Notifications).toHaveLength(1);

      t.withIdentity({ subject: user2 });
      const user2Notifications = await t.query(api.notifications.list, {});
      expect(user2Notifications).toHaveLength(1);

      t.withIdentity({ subject: user3 });
      const user3Notifications = await t.query(api.notifications.list, {});
      expect(user3Notifications).toHaveLength(1);
    });

    it("createBulk - should skip actor in recipients", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });
      const actor = await createTestUser(t, { name: "Actor" });

      // Include actor in recipients
      await t.run(async (ctx) => {
        const { createBulk } = await import("./notifications");
        await createBulk(ctx, {
          userIds: [user1, user2, actor],
          type: "test",
          title: "Test",
          message: "Test",
          actorId: actor,
        });
      });

      // Verify actor didn't get notification
      t.withIdentity({ subject: actor });
      const actorNotifications = await t.query(api.notifications.list, {});
      expect(actorNotifications).toHaveLength(0);

      // But other users did
      t.withIdentity({ subject: user1 });
      const user1Notifications = await t.query(api.notifications.list, {});
      expect(user1Notifications).toHaveLength(1);
    });
  });
});
