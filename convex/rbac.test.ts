// @ts-nocheck - Test file with complex union type assertions

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import type { Id } from "./_generated/dataModel";
import type { ProjectRole } from "./rbac";
import { hasMinimumRole } from "./rbac";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addProjectMember,
  createCompanyAdmin,
  createTestProject,
  createTestUser,
} from "./testUtils";

describe("RBAC Utilities", () => {
  describe("hasMinimumRole", () => {
    it("should return true when user has exact required role", () => {
      expect(hasMinimumRole("viewer", "viewer")).toBe(true);
      expect(hasMinimumRole("editor", "editor")).toBe(true);
      expect(hasMinimumRole("admin", "admin")).toBe(true);
    });

    it("should return true when user has higher role than required", () => {
      expect(hasMinimumRole("editor", "viewer")).toBe(true);
      expect(hasMinimumRole("admin", "viewer")).toBe(true);
      expect(hasMinimumRole("admin", "editor")).toBe(true);
    });

    it("should return false when user has lower role than required", () => {
      expect(hasMinimumRole("viewer", "editor")).toBe(false);
      expect(hasMinimumRole("viewer", "admin")).toBe(false);
      expect(hasMinimumRole("editor", "admin")).toBe(false);
    });

    it("should return false when user has no role (null)", () => {
      expect(hasMinimumRole(null, "viewer")).toBe(false);
      expect(hasMinimumRole(null, "editor")).toBe(false);
      expect(hasMinimumRole(null, "admin")).toBe(false);
    });

    it("should handle role hierarchy correctly", () => {
      const _roles: ProjectRole[] = ["viewer", "editor", "admin"];

      // Viewer can only access viewer
      expect(hasMinimumRole("viewer", "viewer")).toBe(true);
      expect(hasMinimumRole("viewer", "editor")).toBe(false);
      expect(hasMinimumRole("viewer", "admin")).toBe(false);

      // Editor can access viewer and editor
      expect(hasMinimumRole("editor", "viewer")).toBe(true);
      expect(hasMinimumRole("editor", "editor")).toBe(true);
      expect(hasMinimumRole("editor", "admin")).toBe(false);

      // Admin can access everything
      expect(hasMinimumRole("admin", "viewer")).toBe(true);
      expect(hasMinimumRole("admin", "editor")).toBe(true);
      expect(hasMinimumRole("admin", "admin")).toBe(true);
    });
  });

  describe("getProjectRole (workspaceAccess)", () => {
    it("should return 'admin' for project creator", async () => {
      const t = convexTest(schema, modules);

      const userId = await createTestUser(t);
      const workspaceId = await createTestProject(t, userId);

      const role = await t.run(async (ctx) => {
        const { getProjectRole } = await import("./workspaceAccess");
        return await getProjectRole(ctx, workspaceId, userId);
      });

      expect(role).toBe("admin");
    });

    it("should return correct role from workspaceMembers table", async () => {
      const t = convexTest(schema, modules);

      const creatorId = await createTestUser(t, { name: "Creator" });
      const memberId = await createTestUser(t, { name: "Member" });
      const workspaceId = await createTestProject(t, creatorId);

      // Add member as editor
      await addProjectMember(t, workspaceId, memberId, "editor", creatorId);

      const role = await t.run(async (ctx) => {
        const { getProjectRole } = await import("./workspaceAccess");
        return await getProjectRole(ctx, workspaceId, memberId);
      });

      expect(role).toBe("editor");
    });

    it("should return null for non-members", async () => {
      const t = convexTest(schema, modules);

      const creatorId = await createTestUser(t, { name: "Creator" });
      const nonMemberId = await createTestUser(t, { name: "Non-Member" });
      const workspaceId = await createTestProject(t, creatorId);

      const role = await t.run(async (ctx) => {
        const { getProjectRole } = await import("./workspaceAccess");
        return await getProjectRole(ctx, workspaceId, nonMemberId);
      });

      expect(role).toBeNull();
    });

    it("should return null for non-existent project", async () => {
      const t = convexTest(schema, modules);

      const userId = await createTestUser(t);
      const fakeProjectId = "jh71bgkqr4n1pfdx9e1pge7e717mah8k" as Id<"workspaces">;

      const role = await t.run(async (ctx) => {
        const { getProjectRole } = await import("./workspaceAccess");
        return await getProjectRole(ctx, fakeProjectId, userId);
      });

      expect(role).toBeNull();
    });
  });

  describe("canAccessProject (workspaceAccess)", () => {
    it("should allow access to company-visible workspaces for company members", async () => {
      const t = convexTest(schema, modules);

      const creatorId = await createTestUser(t, { name: "Creator" });
      const companyMemberId = await createTestUser(t, { name: "Company Member" });
      const companyId = await createCompanyAdmin(t, creatorId);

      // Add company member (not workspace member)
      const now = Date.now();
      await t.run(async (ctx) => {
        await ctx.db.insert("companyMembers", {
          companyId,
          userId: companyMemberId,
          role: "member",
          addedBy: creatorId,
          addedAt: now,
        });
      });

      // Create company-visible workspace
      const workspaceId = await t.run(async (ctx) => {
        return ctx.db.insert("workspaces", {
          name: "Company Visible Workspace",
          key: "COMPVIS",
          companyId,
          ownerId: creatorId,
          createdBy: creatorId,
          createdAt: now,
          updatedAt: now,
          isPublic: true, // company-visible
          boardType: "kanban",
          workflowStates: [],
        });
      });

      const canAccess = await t.run(async (ctx) => {
        const { canAccessProject } = await import("./workspaceAccess");
        return await canAccessProject(ctx, workspaceId, companyMemberId);
      });

      expect(canAccess).toBe(true);
    });

    it("should require membership for private projects", async () => {
      const t = convexTest(schema, modules);

      const creatorId = await createTestUser(t, { name: "Creator" });
      const memberId = await createTestUser(t, { name: "Member" });
      const nonMemberId = await createTestUser(t, { name: "Non-Member" });
      const workspaceId = await createTestProject(t, creatorId, {
        isPublic: false,
      });

      await addProjectMember(t, workspaceId, memberId, "viewer", creatorId);

      // Creator can access
      const creatorCanAccess = await t.run(async (ctx) => {
        const { canAccessProject } = await import("./workspaceAccess");
        return await canAccessProject(ctx, workspaceId, creatorId);
      });
      expect(creatorCanAccess).toBe(true);

      // Member can access
      const memberCanAccess = await t.run(async (ctx) => {
        const { canAccessProject } = await import("./workspaceAccess");
        return await canAccessProject(ctx, workspaceId, memberId);
      });
      expect(memberCanAccess).toBe(true);

      // Non-member cannot access
      const nonMemberCanAccess = await t.run(async (ctx) => {
        const { canAccessProject } = await import("./workspaceAccess");
        return await canAccessProject(ctx, workspaceId, nonMemberId);
      });
      expect(nonMemberCanAccess).toBe(false);
    });
  });

  describe("canEditProject (workspaceAccess)", () => {
    it("should allow editors to edit", async () => {
      const t = convexTest(schema, modules);

      const creatorId = await createTestUser(t, { name: "Creator" });
      const editorId = await createTestUser(t, { name: "Editor" });
      const workspaceId = await createTestProject(t, creatorId);

      await addProjectMember(t, workspaceId, editorId, "editor", creatorId);

      const canEdit = await t.run(async (ctx) => {
        const { canEditProject } = await import("./workspaceAccess");
        return await canEditProject(ctx, workspaceId, editorId);
      });

      expect(canEdit).toBe(true);
    });

    it("should allow admins to edit", async () => {
      const t = convexTest(schema, modules);

      const creatorId = await createTestUser(t, { name: "Creator" });
      const adminId = await createTestUser(t, { name: "Admin" });
      const workspaceId = await createTestProject(t, creatorId);

      await addProjectMember(t, workspaceId, adminId, "admin", creatorId);

      const canEdit = await t.run(async (ctx) => {
        const { canEditProject } = await import("./workspaceAccess");
        return await canEditProject(ctx, workspaceId, adminId);
      });

      expect(canEdit).toBe(true);
    });

    it("should deny viewers from editing", async () => {
      const t = convexTest(schema, modules);

      const creatorId = await createTestUser(t, { name: "Creator" });
      const viewerId = await createTestUser(t, { name: "Viewer" });
      const workspaceId = await createTestProject(t, creatorId);

      await addProjectMember(t, workspaceId, viewerId, "viewer", creatorId);

      const canEdit = await t.run(async (ctx) => {
        const { canEditProject } = await import("./workspaceAccess");
        return await canEditProject(ctx, workspaceId, viewerId);
      });

      expect(canEdit).toBe(false);
    });
  });

  describe("isProjectAdmin (workspaceAccess)", () => {
    it("should allow only admins to manage", async () => {
      const t = convexTest(schema, modules);

      const creatorId = await createTestUser(t, { name: "Creator" });
      const adminId = await createTestUser(t, { name: "Admin" });
      const editorId = await createTestUser(t, { name: "Editor" });
      const viewerId = await createTestUser(t, { name: "Viewer" });
      const workspaceId = await createTestProject(t, creatorId);

      await addProjectMember(t, workspaceId, adminId, "admin", creatorId);
      await addProjectMember(t, workspaceId, editorId, "editor", creatorId);
      await addProjectMember(t, workspaceId, viewerId, "viewer", creatorId);

      // Creator (admin) can manage
      const creatorCanManage = await t.run(async (ctx) => {
        const { isProjectAdmin } = await import("./workspaceAccess");
        return await isProjectAdmin(ctx, workspaceId, creatorId);
      });
      expect(creatorCanManage).toBe(true);

      // Admin can manage
      const adminCanManage = await t.run(async (ctx) => {
        const { isProjectAdmin } = await import("./workspaceAccess");
        return await isProjectAdmin(ctx, workspaceId, adminId);
      });
      expect(adminCanManage).toBe(true);

      // Editor cannot manage
      const editorCanManage = await t.run(async (ctx) => {
        const { isProjectAdmin } = await import("./workspaceAccess");
        return await isProjectAdmin(ctx, workspaceId, editorId);
      });
      expect(editorCanManage).toBe(false);

      // Viewer cannot manage
      const viewerCanManage = await t.run(async (ctx) => {
        const { isProjectAdmin } = await import("./workspaceAccess");
        return await isProjectAdmin(ctx, workspaceId, viewerId);
      });
      expect(viewerCanManage).toBe(false);
    });
  });

  describe("assertCanEditProject (workspaceAccess)", () => {
    it("should throw for insufficient permissions", async () => {
      const t = convexTest(schema, modules);

      const creatorId = await createTestUser(t, { name: "Creator" });
      const viewerId = await createTestUser(t, { name: "Viewer" });
      const workspaceId = await createTestProject(t, creatorId);

      await addProjectMember(t, workspaceId, viewerId, "viewer", creatorId);

      await expect(async () => {
        await t.run(async (ctx) => {
          const { assertCanEditProject } = await import("./workspaceAccess");
          await assertCanEditProject(ctx, workspaceId, viewerId);
        });
      }).rejects.toThrow("You don't have permission to edit this workspace");
    });

    it("should pass for sufficient permissions", async () => {
      const t = convexTest(schema, modules);

      const creatorId = await createTestUser(t, { name: "Creator" });
      const editorId = await createTestUser(t, { name: "Editor" });
      const workspaceId = await createTestProject(t, creatorId);

      await addProjectMember(t, workspaceId, editorId, "editor", creatorId);

      // Should not throw
      await t.run(async (ctx) => {
        const { assertCanEditProject } = await import("./workspaceAccess");
        await assertCanEditProject(ctx, workspaceId, editorId);
      });
    });
  });
});
