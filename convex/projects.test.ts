import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { createTestUser } from "./test-utils";
import { modules } from "./testSetup";

describe("Projects", () => {
  describe("create", () => {
    it("should create a project with default workflow states", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      t.withIdentity({ subject: userId });

      const projectId = await t.mutation(api.projects.create, {
        name: "Test Project",
        key: "TEST",
        description: "A test project",
        isPublic: false,
        boardType: "kanban",
      });

      expect(projectId).toBeDefined();

      // Verify project was created
      const project = await t.query(api.projects.get, { id: projectId });
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
      t.withIdentity({ subject: userId });

      const projectId = await t.mutation(api.projects.create, {
        name: "Test Project",
        key: "test",
        isPublic: false,
        boardType: "scrum",
      });

      const project = await t.query(api.projects.get, { id: projectId });
      expect(project?.key).toBe("TEST");
    });

    it("should add creator as admin member", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      t.withIdentity({ subject: userId });

      const projectId = await t.mutation(api.projects.create, {
        name: "Test Project",
        key: "ADMIN",
        isPublic: false,
        boardType: "kanban",
      });

      const project = await t.query(api.projects.get, { id: projectId });
      expect(project?.userRole).toBe("admin");
      expect(project?.isOwner).toBe(true);
    });

    it("should reject duplicate project keys", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      t.withIdentity({ subject: userId });

      await t.mutation(api.projects.create, {
        name: "First Project",
        key: "DUP",
        isPublic: false,
        boardType: "kanban",
      });

      await expect(async () => {
        await t.mutation(api.projects.create, {
          name: "Second Project",
          key: "DUP",
          isPublic: false,
          boardType: "kanban",
        });
      }).rejects.toThrow("Project key already exists");
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      await expect(async () => {
        await t.mutation(api.projects.create, {
          name: "Test Project",
          key: "UNAUTH",
          isPublic: false,
          boardType: "kanban",
        });
      }).rejects.toThrow("Not authenticated");
    });
  });

  describe("get", () => {
    it("should return project details for owner", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, { name: "Owner" });
      t.withIdentity({ subject: userId });

      const projectId = await t.mutation(api.projects.create, {
        name: "My Project",
        key: "MINE",
        description: "Owner's project",
        isPublic: false,
        boardType: "kanban",
      });

      const project = await t.query(api.projects.get, { id: projectId });
      expect(project).toBeDefined();
      expect(project?.name).toBe("My Project");
      expect(project?.isOwner).toBe(true);
      expect(project?.userRole).toBe("admin");
    });

    it("should return public projects for anyone", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const other = await createTestUser(t, { name: "Other" });

      // Create public project as owner
      t.withIdentity({ subject: owner });
      const projectId = await t.mutation(api.projects.create, {
        name: "Public Project",
        key: "PUBLIC",
        isPublic: true,
        boardType: "kanban",
      });

      // Access as different user
      t.withIdentity({ subject: other });
      const project = await t.query(api.projects.get, { id: projectId });
      expect(project).toBeDefined();
      expect(project?.name).toBe("Public Project");
      expect(project?.isPublic).toBe(true);
      expect(project?.isOwner).toBe(false);
    });

    it("should deny access to private projects for non-members", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const nonMember = await createTestUser(t, { name: "Non-Member" });

      // Create private project
      t.withIdentity({ subject: owner });
      const projectId = await t.mutation(api.projects.create, {
        name: "Private Project",
        key: "PRIVATE",
        isPublic: false,
        boardType: "kanban",
      });

      // Try to access as non-member
      t.withIdentity({ subject: nonMember });
      await expect(async () => {
        await t.query(api.projects.get, { id: projectId });
      }).rejects.toThrow("Not authorized to access this project");
    });

    it("should return null for non-existent projects", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      t.withIdentity({ subject: userId });

      const fakeId = "jh71bgkqr4n1pfdx9e1pge7e717mah8k" as any;
      const project = await t.query(api.projects.get, { id: fakeId });
      expect(project).toBeNull();
    });
  });

  describe("list", () => {
    it("should return all accessible projects for user", async () => {
      const t = convexTest(schema, modules);
      const user1 = await createTestUser(t, { name: "User 1" });
      const user2 = await createTestUser(t, { name: "User 2" });

      // User 1 creates two projects
      t.withIdentity({ subject: user1 });
      await t.mutation(api.projects.create, {
        name: "User 1 Project",
        key: "U1",
        isPublic: false,
        boardType: "kanban",
      });
      await t.mutation(api.projects.create, {
        name: "Public Project",
        key: "PUB",
        isPublic: true,
        boardType: "scrum",
      });

      // User 2 creates one project
      t.withIdentity({ subject: user2 });
      await t.mutation(api.projects.create, {
        name: "User 2 Project",
        key: "U2",
        isPublic: false,
        boardType: "kanban",
      });

      // User 2 should see: their own project + the public project
      const user2Projects = await t.query(api.projects.list, {});
      expect(user2Projects).toHaveLength(2);
      const projectNames = user2Projects.map((p) => p.name);
      expect(projectNames).toContain("User 2 Project");
      expect(projectNames).toContain("Public Project");
      expect(projectNames).not.toContain("User 1 Project");
    });

    it("should return empty array for unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      const projects = await t.query(api.projects.list, {});
      expect(projects).toEqual([]);
    });

    it("should include project metadata (issue count, role)", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      t.withIdentity({ subject: userId });

      await t.mutation(api.projects.create, {
        name: "Test Project",
        key: "META",
        isPublic: false,
        boardType: "kanban",
      });

      const projects = await t.query(api.projects.list, {});
      expect(projects).toHaveLength(1);
      expect(projects[0]).toHaveProperty("issueCount");
      expect(projects[0]).toHaveProperty("userRole");
      expect(projects[0]).toHaveProperty("isOwner");
      expect(projects[0]).toHaveProperty("isMember");
    });
  });

  describe("updateWorkflow", () => {
    it("should allow admins to update workflow states", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t, { name: "Admin" });
      t.withIdentity({ subject: adminId });

      const projectId = await t.mutation(api.projects.create, {
        name: "Workflow Project",
        key: "WF",
        isPublic: false,
        boardType: "kanban",
      });

      const customWorkflow = [
        { id: "backlog", name: "Backlog", category: "todo" as const, order: 0 },
        { id: "dev", name: "Development", category: "inprogress" as const, order: 1 },
        { id: "done", name: "Completed", category: "done" as const, order: 2 },
      ];

      await t.mutation(api.projects.updateWorkflow, {
        projectId,
        workflowStates: customWorkflow,
      });

      const project = await t.query(api.projects.get, { id: projectId });
      expect(project?.workflowStates).toHaveLength(3);
      expect(project?.workflowStates[0].name).toBe("Backlog");
      expect(project?.workflowStates[1].name).toBe("Development");
      expect(project?.workflowStates[2].name).toBe("Completed");
    });

    it("should deny editors from updating workflow", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t, { name: "Admin" });
      const editorId = await createTestUser(t, { name: "Editor", email: "editor@test.com" });

      t.withIdentity({ subject: adminId });
      const projectId = await t.mutation(api.projects.create, {
        name: "Test Project",
        key: "DENY",
        isPublic: false,
        boardType: "kanban",
      });

      // Add editor as member
      await t.mutation(api.projects.addMember, {
        projectId,
        userEmail: "editor@test.com",
        role: "editor",
      });

      // Try to update workflow as editor
      t.withIdentity({ subject: editorId });
      await expect(async () => {
        await t.mutation(api.projects.updateWorkflow, {
          projectId,
          workflowStates: [{ id: "todo", name: "To Do", category: "todo" as const, order: 0 }],
        });
      }).rejects.toThrow("Insufficient permissions");
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t);
      t.withIdentity({ subject: adminId });

      const projectId = await t.mutation(api.projects.create, {
        name: "Test Project",
        key: "UNAUTH",
        isPublic: false,
        boardType: "kanban",
      });

      // Try without authentication
      t.withIdentity({ subject: undefined });
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

        t.withIdentity({ subject: adminId });
        const projectId = await t.mutation(api.projects.create, {
          name: "Team Project",
          key: "TEAM",
          isPublic: false,
          boardType: "kanban",
        });

        await t.mutation(api.projects.addMember, {
          projectId,
          userEmail: "newmember@test.com",
          role: "editor",
        });

        // Verify member was added
        t.withIdentity({ subject: newMemberId });
        const project = await t.query(api.projects.get, { id: projectId });
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

        t.withIdentity({ subject: adminId });
        const projectId = await t.mutation(api.projects.create, {
          name: "Test Project",
          key: "NOADD",
          isPublic: false,
          boardType: "kanban",
        });

        await t.mutation(api.projects.addMember, {
          projectId,
          userEmail: "editor@test.com",
          role: "editor",
        });

        // Try to add member as editor
        t.withIdentity({ subject: editorId });
        await expect(async () => {
          await t.mutation(api.projects.addMember, {
            projectId,
            userEmail: "new@test.com",
            role: "viewer",
          });
        }).rejects.toThrow("Insufficient permissions");
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

        t.withIdentity({ subject: adminId });
        const projectId = await t.mutation(api.projects.create, {
          name: "Test Project",
          key: "ROLE",
          isPublic: false,
          boardType: "kanban",
        });

        await t.mutation(api.projects.addMember, {
          projectId,
          userEmail: "member@test.com",
          role: "viewer",
        });

        await t.mutation(api.projects.updateMemberRole, {
          projectId,
          userId: memberId,
          role: "editor",
        });

        // Verify role was updated
        t.withIdentity({ subject: memberId });
        const project = await t.query(api.projects.get, { id: projectId });
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

        t.withIdentity({ subject: adminId });
        const projectId = await t.mutation(api.projects.create, {
          name: "Test Project",
          key: "REMOVE",
          isPublic: false,
          boardType: "kanban",
        });

        await t.mutation(api.projects.addMember, {
          projectId,
          userEmail: "member@test.com",
          role: "editor",
        });

        await t.mutation(api.projects.removeMember, {
          projectId,
          userId: memberId,
        });

        // Verify member was removed
        t.withIdentity({ subject: memberId });
        await expect(async () => {
          await t.query(api.projects.get, { id: projectId });
        }).rejects.toThrow("Not authorized to access this project");
      });

      it("should prevent removing project creator", async () => {
        const t = convexTest(schema, modules);
        const creatorId = await createTestUser(t, { name: "Creator" });

        t.withIdentity({ subject: creatorId });
        const projectId = await t.mutation(api.projects.create, {
          name: "Test Project",
          key: "NOCREATOR",
          isPublic: false,
          boardType: "kanban",
        });

        await expect(async () => {
          await t.mutation(api.projects.removeMember, {
            projectId,
            userId: creatorId,
          });
        }).rejects.toThrow();
      });
    });
  });
});
