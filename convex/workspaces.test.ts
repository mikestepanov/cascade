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

  describe("remove", () => {
    it("should allow company admin to delete workspace", async () => {
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

      // Verify deletion
      await asUser.mutation(api.workspaces.remove, { id: workspaceId });

      const workspace = await t.run(async (ctx) => ctx.db.get(workspaceId));
      expect(workspace).toBeNull();
    });

    it("should allow workspace creator (admin) to delete workspace", async () => {
      const t = convexTest(schema, modules);
      // Company Owner
      const ownerId = await createTestUser(t);
      const asOwner = asAuthenticatedUser(t, ownerId);

      const { companyId } = await asOwner.mutation(api.companies.createCompany, {
        name: "Test Company",
        timezone: "America/New_York",
      });

      // Another Admin who creates the workspace
      const creatorId = await createTestUser(t);
      const asCreator = asAuthenticatedUser(t, creatorId);

      // Add creator as company admin
      await asOwner.mutation(api.companies.addMember, {
        companyId,
        userId: creatorId,
        role: "admin",
      });

      const workspaceId = await asCreator.mutation(api.workspaces.create, {
        name: "Creator's Workspace",
        slug: "creators-workspace",
        companyId,
      });

      // Now demote creator to member, or simply test as them (they are creator)
      // Even if they are just a member now, if they created it, they should be able to delete it?
      // Wait, logic says `workspace.createdBy === userId` OR `isCompanyAdmin`.
      // If I demote them to member, `isCompanyAdmin` is false.
      // So I should test that scenario: Creator but not Admin.

      await asOwner.mutation(api.companies.updateMemberRole, {
        companyId,
        userId: creatorId,
        role: "member"
      });

      const role = await asCreator.query(api.companies.getUserRole, { companyId });
      expect(role).toBe("member");

      // Attempt delete
      await asCreator.mutation(api.workspaces.remove, { id: workspaceId });

      const workspace = await t.run(async (ctx) => ctx.db.get(workspaceId));
      expect(workspace).toBeNull();
    });

    it("should deny non-admin member from deleting workspace", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const memberId = await createTestUser(t);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { companyId } = await asOwner.mutation(api.companies.createCompany, {
        name: "Test Company",
        timezone: "America/New_York",
      });

      const workspaceId = await asOwner.mutation(api.workspaces.create, {
        name: "Test Workspace",
        slug: "test-workspace",
        companyId,
      });

      // Add member
      await asOwner.mutation(api.companies.addMember, {
        companyId,
        userId: memberId,
        role: "member",
      });

      const asMember = asAuthenticatedUser(t, memberId);

      // Attempt delete
      await expect(async () => {
        await asMember.mutation(api.workspaces.remove, { id: workspaceId });
      }).rejects.toThrow("Only workspace admins or company admins can delete workspaces");
    });

    it("should deny deleting workspace with teams", async () => {
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

      // Create a team in the workspace
      // Assuming api.teams.create exists or inserting directly
      // Since I don't see teams.ts content, I will insert directly via t.run
      await t.run(async (ctx) => {
        await ctx.db.insert("teams", {
          companyId,
          workspaceId,
          name: "Test Team",
          slug: "test-team",
          createdBy: userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isPrivate: false
        });
      });

      await expect(async () => {
        await asUser.mutation(api.workspaces.remove, { id: workspaceId });
      }).rejects.toThrow("Cannot delete workspace with teams. Please delete or move teams first.");
    });

    it("should deny deleting workspace with projects", async () => {
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

      // Create a project in the workspace
      await t.run(async (ctx) => {
        await ctx.db.insert("projects", {
          name: "Test Project",
          key: "TEST",
          companyId,
          workspaceId,
          ownerId: userId,
          createdBy: userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          boardType: "kanban",
          workflowStates: []
        });
      });

      await expect(async () => {
        await asUser.mutation(api.workspaces.remove, { id: workspaceId });
      }).rejects.toThrow("Cannot delete workspace with projects. Please delete or move projects first.");
    });
  });
});
