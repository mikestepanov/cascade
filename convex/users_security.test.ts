import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("Users Security", () => {
  describe("updateProfile", () => {
    it("should revoke email verification when email is changed", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      // Manually verify the user
      await t.run(async (ctx) => {
        await ctx.db.patch(userId, {
          emailVerificationTime: Date.now(),
          email: "old@example.com",
        });
      });

      const asUser = asAuthenticatedUser(t, userId);

      // Verify initial state
      let user = await t.run(async (ctx) => ctx.db.get(userId));
      expect(user?.email).toBe("old@example.com");
      expect(user?.emailVerificationTime).toBeDefined();

      // Change email
      await asUser.mutation(api.users.updateProfile, {
        email: "new@example.com",
      });

      // Check if verification was revoked
      user = await t.run(async (ctx) => ctx.db.get(userId));
      expect(user?.email).toBe("new@example.com");

      // THIS IS EXPECTED TO FAIL BEFORE FIX
      expect(user?.emailVerificationTime).toBeUndefined();
    });

    it("should NOT revoke verification when email is unchanged", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const verifiedTime = Date.now();
      await t.run(async (ctx) => {
        await ctx.db.patch(userId, {
          emailVerificationTime: verifiedTime,
          email: "same@example.com",
        });
      });

      const asUser = asAuthenticatedUser(t, userId);

      // Update with same email
      await asUser.mutation(api.users.updateProfile, {
        email: "same@example.com",
      });

      const user = await t.run(async (ctx) => ctx.db.get(userId));
      expect(user?.email).toBe("same@example.com");
      expect(user?.emailVerificationTime).toBe(verifiedTime);
    });

    it("should synchronize email change to authAccounts", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const oldEmail = "old@example.com";
      const newEmail = "new@example.com";

      // Set initial email
      await t.run(async (ctx) => {
        await ctx.db.patch(userId, {
          email: oldEmail,
          emailVerificationTime: Date.now(),
        });

        // Create authAccount
        await ctx.db.insert("authAccounts", {
          userId,
          provider: "password",
          providerAccountId: oldEmail,
          secret: "hashedpassword",
          emailVerified: new Date().toISOString(),
        });
      });

      const asUser = asAuthenticatedUser(t, userId);

      // Change email via updateProfile
      await asUser.mutation(api.users.updateProfile, {
        email: newEmail,
      });

      // Verify authAccount state
      const authAccount = await t.run(async (ctx) => {
        return await ctx.db
          .query("authAccounts")
          .withIndex("userIdAndProvider", (q) => q.eq("userId", userId).eq("provider", "password"))
          .first();
      });

      expect(authAccount?.providerAccountId).toBe(newEmail);
      expect(authAccount?.emailVerified).toBeUndefined();
    });
  });
});
