import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("Workspaces", () => {
  describe("create", () => {
    it("should allow company admin to create workspace", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { companyId } = await asUser.mutation(api.companies.createCompany, {
        name: "Test Company",
        timezone: "America/New_York",
      });

      const workspaceId = await asUser.mutation(api.workspaces.create, {
        name: "Test Workspace",
        slug: "test-workspace",
        companyId,
      });

      expect(workspaceId).toBeDefined();

      const workspace = await t.run(async (ctx) => ctx.db.get(workspaceId));
      expect(workspace?.name).toBe("Test Workspace");
      expect(workspace?.companyId).toBe(companyId);
    });

    it("should allow company owner to create workspace", async () => {
      // Owner is also an admin
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { companyId } = await asUser.mutation(api.companies.createCompany, {
        name: "Test Company",
        timezone: "America/New_York",
      });

      // Verify role is owner
      const role = await asUser.query(api.companies.getUserRole, { companyId });
      expect(role).toBe("owner");

      const workspaceId = await asUser.mutation(api.workspaces.create, {
        name: "Test Workspace",
        slug: "test-workspace",
        companyId,
      });

      expect(workspaceId).toBeDefined();
    });

    it("should deny non-admin member from creating workspace", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const memberId = await createTestUser(t);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { companyId } = await asOwner.mutation(api.companies.createCompany, {
        name: "Test Company",
        timezone: "America/New_York",
      });

      // Add member
      await asOwner.mutation(api.companies.addMember, {
        companyId,
        userId: memberId,
        role: "member",
      });

      const asMember = asAuthenticatedUser(t, memberId);

      // Verify role is member
      const role = await asMember.query(api.companies.getUserRole, { companyId });
      expect(role).toBe("member");

      await expect(async () => {
        await asMember.mutation(api.workspaces.create, {
          name: "Test Workspace",
          slug: "test-workspace",
          companyId,
        });
      }).rejects.toThrow("Only company admins can create workspaces");
    });
  });
});
