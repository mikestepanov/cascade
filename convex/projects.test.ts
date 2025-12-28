// @ts-nocheck - Test file with complex union type assertions

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createCompanyAdmin, createTestUser } from "./testUtils";

describe("Projects", () => {
  describe("create", () => {
    it("should create a project with default workflow states", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const companyId = await createCompanyAdmin(t, userId);
      const asUser = asAuthenticatedUser(t, userId);

      const projectId = await asUser.mutation(api.projects.create, {
        name: "Test Project",
        key: "TEST",
        description: "A test project",
        isPublic: false,
        boardType: "kanban",
        companyId,
      });

      expect(projectId).toBeDefined();

      // Verify project was created
      const project = await asUser.query(api.projects.get, { id: projectId });
      expect(project).toBeDefined();
      expect(project?.name).toBe("Test Project");
      expect(project?.key).toBe("TEST");
      expect(project?.description).toBe("A test project");
      expect(project?.isPublic).toBe(false);
      expect(project?.boardType).toBe("kanban");
      expect(project?.createdBy).toBe(userId);
      expect(project?.workflowStates).toHaveLength(4); // Default workflow states
    });

    it("should uppercase project keys", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const companyId = await createCompanyAdmin(t, userId);
      const asUser = asAuthenticatedUser(t, userId);

      const projectId = await asUser.mutation(api.projects.create, {
        name: "Test Project",
        key: "test",
        isPublic: false,
        boardType: "scrum",
        companyId,
      });

      const project = await asUser.query(api.projects.get, { id: projectId });
      expect(project?.key).toBe("TEST");
    });

    it("should add creator as admin member", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const companyId = await createCompanyAdmin(t, userId);
      const asUser = asAuthenticatedUser(t, userId);

      const projectId = await asUser.mutation(api.projects.create, {
        name: "Test Project",
        key: "ADMIN",
        isPublic: false,
        boardType: "kanban",
        companyId,
      });

      const project = await asUser.query(api.projects.get, { id: projectId });
      expect(project?.userRole).toBe("admin");
      expect(project?.isOwner).toBe(true);
    });

    it("should reject duplicate project keys", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const companyId = await createCompanyAdmin(t, userId);
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.projects.create, {
        name: "First Project",
        key: "DUP",
        isPublic: false,
        boardType: "kanban",
        companyId,
      });

      await expect(async () => {
        await asUser.mutation(api.projects.create, {
          name: "Second Project",
          key: "DUP",
          isPublic: false,
          boardType: "kanban",
          companyId,
        });
      }).rejects.toThrow("Project key already exists");
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      // Create a user and company for the companyId, but don't authenticate
      const userId = await createTestUser(t);
      const companyId = await createCompanyAdmin(t, userId);

      await expect(async () => {
        await t.mutation(api.projects.create, {
          name: "Test Project",
          key: "UNAUTH",
          isPublic: false,
          boardType: "kanban",
          companyId,
        });
      }).rejects.toThrow("Not authenticated");
    });
  });

  describe("get", () => {
    it("should return project details for owner", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, { name: "Owner" });
      const companyId = await createCompanyAdmin(t, userId);
      const asUser = asAuthenticatedUser(t, userId);

      const projectId = await asUser.mutation(api.projects.create, {
        name: "My Project",
        key: "MINE",
        description: "Owner's project",
        isPublic: false,
        boardType: "kanban",
        companyId,
      });

      const project = await asUser.query(api.projects.get, { id: projectId });
      expect(project).toBeDefined();
      expect(project?.name).toBe("My Project");
      expect(project?.isOwner).toBe(true);
      expect(project?.userRole).toBe("admin");
    });

    it("should return company-visible projects for company members", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const companyMember = await createTestUser(t, { name: "Company Member" });

      // Create a company first
      const companyId = await t.run(async (ctx) => {
        return ctx.db.insert("companies", {
          name: "Test Company",
          slug: "test-company",
          timezone: "America/New_York",
          settings: {
            defaultMaxHoursPerWeek: 40,
            defaultMaxHoursPerDay: 8,
            requiresTimeApproval: false,
            billingEnabled: false,
          },
          createdBy: owner,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });

      // Add both users to the company
      const now = Date.now();
      await t.run(async (ctx) => {
        await ctx.db.insert("companyMembers", {
          companyId,
          userId: owner,
          role: "admin",
          addedBy: owner,
          addedAt: now,
        });
        await ctx.db.insert("companyMembers", {
          companyId,
          userId: companyMember,
          role: "member",
          addedBy: owner,
          addedAt: now,
        });
      });

      // Create company-visible project as owner
      const asOwner = asAuthenticatedUser(t, owner);
      const projectId = await asOwner.mutation(api.projects.create, {
        name: "Company Visible Project",
        key: "COMPVIS",
        isPublic: true, // isPublic means company-visible
        companyId,
        boardType: "kanban",
      });

      // Access as different company member
      const asMember = asAuthenticatedUser(t, companyMember);
      const project = await asMember.query(api.projects.get, { id: projectId });
      expect(project).toBeDefined();
      expect(project?.name).toBe("Company Visible Project");
      expect(project?.isPublic).toBe(true);
      expect(project?.isOwner).toBe(false);
    });

    it("should deny access to private projects for non-members", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const nonMember = await createTestUser(t, { name: "Non-Member" });
      const companyId = await createCompanyAdmin(t, owner);

      // Create private project
      const asOwner = asAuthenticatedUser(t, owner);
      const projectId = await asOwner.mutation(api.projects.create, {
        name: "Private Project",
        key: "PRIVATE",
        isPublic: false,
        boardType: "kanban",
        companyId,
      });

      // Try to access as non-member
      const asNonMember = asAuthenticatedUser(t, nonMember);
      await expect(async () => {
        await asNonMember.query(api.projects.get, { id: projectId });
      }).rejects.toThrow("Not authorized to access this project");
    });

    it("should return null for non-existent projects", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const companyId = await createCompanyAdmin(t, userId);
      const asUser = asAuthenticatedUser(t, userId);

      // Create and delete a project to test non-existent ID behavior
      const projectId = await asUser.mutation(api.projects.create, {
        name: "To Delete",
        key: "DELETE",
        isPublic: false,
        boardType: "kanban",
        companyId,
      });

      await t.run(async (ctx) => {
        await ctx.db.delete(projectId);
      });

      const project = await asUser.query(api.projects.get, { id: projectId });
      expect(project).toBeNull();
    });
  });

  describe("list", () => {
    it("should return only projects user is a member of", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });
      const companyId1 = await createCompanyAdmin(t, user1);
      const companyId2 = await createCompanyAdmin(t, user2);

      // User 1 creates two projects (one private, one with isPublic flag - legacy)
      const asUser1 = asAuthenticatedUser(t, user1);
      await asUser1.mutation(api.projects.create, {
        name: "User 1 Project",
        key: "U1",
        isPublic: false,
        boardType: "kanban",
        companyId: companyId1,
      });
      await asUser1.mutation(api.projects.create, {
        name: "User 1 Other Project",
        key: "U1B",
        isPublic: true, // Legacy flag - doesn't grant access to non-members
        boardType: "scrum",
        companyId: companyId1,
      });

      // User 2 creates one project
      const asUser2 = asAuthenticatedUser(t, user2);
      await asUser2.mutation(api.projects.create, {
        name: "User 2 Project",
        key: "U2",
        isPublic: false,
        boardType: "kanban",
        companyId: companyId2,
      });

      // User 2 should only see their own project (membership-based access)
      const { page: user2Projects } = await asUser2.query(api.projects.list, {
        paginationOpts: { numItems: 10, cursor: null },
      });
      expect(user2Projects).toHaveLength(1);
      const projectNames = user2Projects.map((p) => p.name);
      expect(projectNames).toContain("User 2 Project");
      expect(projectNames).not.toContain("User 1 Project");
      expect(projectNames).not.toContain("User 1 Other Project");
    });

    it("should return empty array for unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      const { page: projects } = await t.query(api.projects.list, {
        paginationOpts: { numItems: 10, cursor: null },
      });
      expect(projects).toEqual([]);
    });

    it("should include project metadata (issue count, role)", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const companyId = await createCompanyAdmin(t, userId);
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.projects.create, {
        name: "Test Project",
        key: "META",
        isPublic: false,
        boardType: "kanban",
        companyId,
      });

      const { page: projects } = await asUser.query(api.projects.list, {
        paginationOpts: { numItems: 10, cursor: null },
      });
      expect(projects).toHaveLength(1);
      expect(projects[0]).toHaveProperty("issueCount");
      expect(projects[0]).toHaveProperty("userRole");
      expect(projects[0]).toHaveProperty("isOwner");
    });
  });

  describe("updateWorkflow", () => {
    it("should allow admins to update workflow states", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t, { name: "Admin" });
      const companyId = await createCompanyAdmin(t, adminId);
      const asAdmin = asAuthenticatedUser(t, adminId);

      const projectId = await asAdmin.mutation(api.projects.create, {
        name: "Workflow Project",
        key: "WF",
        isPublic: false,
        boardType: "kanban",
        companyId,
      });

      const customWorkflow = [
        { id: "backlog", name: "Backlog", category: "todo" as const, order: 0 },
        { id: "dev", name: "Development", category: "inprogress" as const, order: 1 },
        { id: "done", name: "Completed", category: "done" as const, order: 2 },
      ];

      await asAdmin.mutation(api.projects.updateWorkflow, {
        projectId,
        workflowStates: customWorkflow,
      });

      const project = await asAdmin.query(api.projects.get, { id: projectId });
      expect(project?.workflowStates).toHaveLength(3);
      expect(project?.workflowStates[0].name).toBe("Backlog");
      expect(project?.workflowStates[1].name).toBe("Development");
      expect(project?.workflowStates[2].name).toBe("Completed");
    });

    it("should deny editors from updating workflow", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t, { name: "Admin" });
      const editorId = await createTestUser(t, { name: "Editor", email: "editor@test.com" });
      const companyId = await createCompanyAdmin(t, adminId);

      const asAdmin = asAuthenticatedUser(t, adminId);
      const projectId = await asAdmin.mutation(api.projects.create, {
        name: "Test Project",
        key: "DENY",
        isPublic: false,
        boardType: "kanban",
        companyId,
      });

      // Add editor as member
      await asAdmin.mutation(api.projects.addMember, {
        projectId,
        userEmail: "editor@test.com",
        role: "editor",
      });

      // Try to update workflow as editor
      const asEditor = asAuthenticatedUser(t, editorId);
      await expect(async () => {
        await asEditor.mutation(api.projects.updateWorkflow, {
          projectId,
          workflowStates: [{ id: "todo", name: "To Do", category: "todo" as const, order: 0 }],
        });
      }).rejects.toThrow();
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t);
      const companyId = await createCompanyAdmin(t, adminId);
      const asAdmin = asAuthenticatedUser(t, adminId);

      const projectId = await asAdmin.mutation(api.projects.create, {
        name: "Test Project",
        key: "UNAUTH",
        isPublic: false,
        boardType: "kanban",
        companyId,
      });

      // Try without authentication
      await expect(async () => {
        await t.mutation(api.projects.updateWorkflow, {
          projectId,
          workflowStates: [],
        });
      }).rejects.toThrow("Not authenticated");
    });
  });

  describe("member management", () => {
    describe("addMember", () => {
      it("should allow admins to add members", async () => {
        const t = convexTest(schema, modules);
        const adminId = await createTestUser(t, { name: "Admin" });
        const newMemberId = await createTestUser(t, {
          name: "New Member",
          email: "newmember@test.com",
        });
        const companyId = await createCompanyAdmin(t, adminId);

        const asAdmin = asAuthenticatedUser(t, adminId);
        const projectId = await asAdmin.mutation(api.projects.create, {
          name: "Team Project",
          key: "TEAM",
          isPublic: false,
          boardType: "kanban",
          companyId,
        });

        await asAdmin.mutation(api.projects.addMember, {
          projectId,
          userEmail: "newmember@test.com",
          role: "editor",
        });

        // Verify member was added
        const asNewMember = asAuthenticatedUser(t, newMemberId);
        const project = await asNewMember.query(api.projects.get, { id: projectId });
        expect(project?.userRole).toBe("editor");
        expect(project?.members.some((m) => m._id === newMemberId)).toBe(true);
      });

      it("should deny non-admins from adding members", async () => {
        const t = convexTest(schema, modules);
        const adminId = await createTestUser(t, { name: "Admin" });
        const editorId = await createTestUser(t, {
          name: "Editor",
          email: "editor@test.com",
        });
        await createTestUser(t, { name: "New", email: "new@test.com" });
        const companyId = await createCompanyAdmin(t, adminId);

        const asAdmin = asAuthenticatedUser(t, adminId);
        const projectId = await asAdmin.mutation(api.projects.create, {
          name: "Test Project",
          key: "NOADD",
          isPublic: false,
          boardType: "kanban",
          companyId,
        });

        await asAdmin.mutation(api.projects.addMember, {
          projectId,
          userEmail: "editor@test.com",
          role: "editor",
        });

        // Try to add member as editor
        const asEditor = asAuthenticatedUser(t, editorId);
        await expect(async () => {
          await asEditor.mutation(api.projects.addMember, {
            projectId,
            userEmail: "new@test.com",
            role: "viewer",
          });
        }).rejects.toThrow();
      });
    });

    describe("updateMemberRole", () => {
      it("should allow admins to update member roles", async () => {
        const t = convexTest(schema, modules);
        const adminId = await createTestUser(t, { name: "Admin" });
        const memberId = await createTestUser(t, {
          name: "Member",
          email: "member@test.com",
        });
        const companyId = await createCompanyAdmin(t, adminId);

        const asAdmin = asAuthenticatedUser(t, adminId);
        const projectId = await asAdmin.mutation(api.projects.create, {
          name: "Test Project",
          key: "ROLE",
          isPublic: false,
          boardType: "kanban",
          companyId,
        });

        await asAdmin.mutation(api.projects.addMember, {
          projectId,
          userEmail: "member@test.com",
          role: "viewer",
        });

        await asAdmin.mutation(api.projects.updateMemberRole, {
          projectId,
          memberId: memberId,
          newRole: "editor",
        });

        // Verify role was updated
        const asMember = asAuthenticatedUser(t, memberId);
        const project = await asMember.query(api.projects.get, { id: projectId });
        expect(project?.userRole).toBe("editor");
      });
    });

    describe("removeMember", () => {
      it("should allow admins to remove members", async () => {
        const t = convexTest(schema, modules);
        const adminId = await createTestUser(t, { name: "Admin" });
        const memberId = await createTestUser(t, {
          name: "Member",
          email: "member@test.com",
        });
        const companyId = await createCompanyAdmin(t, adminId);

        const asAdmin = asAuthenticatedUser(t, adminId);
        const projectId = await asAdmin.mutation(api.projects.create, {
          name: "Test Project",
          key: "REMOVE",
          isPublic: false,
          boardType: "kanban",
          companyId,
        });

        await asAdmin.mutation(api.projects.addMember, {
          projectId,
          userEmail: "member@test.com",
          role: "editor",
        });

        await asAdmin.mutation(api.projects.removeMember, {
          projectId,
          memberId: memberId,
        });

        // Verify member was removed
        const asMember = asAuthenticatedUser(t, memberId);
        await expect(async () => {
          await asMember.query(api.projects.get, { id: projectId });
        }).rejects.toThrow("Not authorized to access this project");
      });

      it("should prevent removing project creator", async () => {
        const t = convexTest(schema, modules);
        const creatorId = await createTestUser(t, { name: "Creator" });
        const companyId = await createCompanyAdmin(t, creatorId);

        const asCreator = asAuthenticatedUser(t, creatorId);
        const projectId = await asCreator.mutation(api.projects.create, {
          name: "Test Project",
          key: "NOCREATOR",
          isPublic: false,
          boardType: "kanban",
          companyId,
        });

        await expect(async () => {
          await asCreator.mutation(api.projects.removeMember, {
            projectId,
            memberId: creatorId,
          });
        }).rejects.toThrow();
      });
    });
  });
});
