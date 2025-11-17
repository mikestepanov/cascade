import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { createTestProject, createTestUser } from "./test-utils";
import { modules } from "./testSetup";

describe("Sprints", () => {
  describe("create", () => {
    it("should create a sprint with all fields", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });
      const startDate = Date.now();
      const endDate = startDate + 14 * 24 * 60 * 60 * 1000; // 2 weeks

      const sprintId = await t.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
        goal: "Complete user authentication",
        startDate,
        endDate,
      });

      expect(sprintId).toBeDefined();

      // Verify sprint was created correctly
      const sprint = await t.run(async (ctx) => {
        return await ctx.db.get(sprintId);
      });

      expect(sprint?.name).toBe("Sprint 1");
      expect(sprint?.goal).toBe("Complete user authentication");
      expect(sprint?.startDate).toBe(startDate);
      expect(sprint?.endDate).toBe(endDate);
      expect(sprint?.status).toBe("future");
      expect(sprint?.createdBy).toBe(userId);
      expect(sprint?.createdAt).toBeDefined();
      expect(sprint?.updatedAt).toBeDefined();
    });

    it("should create a sprint with minimal fields", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });
      const sprintId = await t.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      const sprint = await t.run(async (ctx) => {
        return await ctx.db.get(sprintId);
      });

      expect(sprint?.name).toBe("Sprint 1");
      expect(sprint?.goal).toBeUndefined();
      expect(sprint?.startDate).toBeUndefined();
      expect(sprint?.endDate).toBeUndefined();
      expect(sprint?.status).toBe("future");
    });

    it("should allow project members to create sprints", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const member = await createTestUser(t, {
        name: "Member",
        email: "member@test.com",
      });
      const projectId = await createTestProject(t, owner);

      // Add member to project
      t.withIdentity({ subject: owner });
      await t.mutation(api.projects.addMember, {
        projectId,
        userEmail: "member@test.com",
        role: "editor",
      });

      // Member creates sprint
      t.withIdentity({ subject: member });
      const sprintId = await t.mutation(api.sprints.create, {
        projectId,
        name: "Member Sprint",
      });

      expect(sprintId).toBeDefined();
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: undefined });
      await expect(async () => {
        await t.mutation(api.sprints.create, {
          projectId,
          name: "Unauthorized Sprint",
        });
      }).rejects.toThrow("Not authenticated");
    });

    it("should deny non-members from creating sprints", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const other = await createTestUser(t, { name: "Other" });
      const projectId = await createTestProject(t, owner);

      t.withIdentity({ subject: other });
      await expect(async () => {
        await t.mutation(api.sprints.create, {
          projectId,
          name: "Unauthorized Sprint",
        });
      }).rejects.toThrow("Not authorized");
    });

    it("should throw error for non-existent project", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      t.withIdentity({ subject: userId });
      const fakeProjectId = "jh71bgkqr4n1pfdx9e1pge7e717mah8k" as Id<"projects">;

      await expect(async () => {
        await t.mutation(api.sprints.create, {
          projectId: fakeProjectId,
          name: "Sprint 1",
        });
      }).rejects.toThrow("Project not found");
    });
  });

  describe("listByProject", () => {
    it("should list all sprints for a project", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });
      await t.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });
      await t.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 2",
      });
      await t.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 3",
      });

      const sprints = await t.query(api.sprints.listByProject, { projectId });

      expect(sprints).toHaveLength(3);
      expect(sprints[0]?.name).toBe("Sprint 3"); // Most recent first
      expect(sprints[1]?.name).toBe("Sprint 2");
      expect(sprints[2]?.name).toBe("Sprint 1");
    });

    it("should include issue count for each sprint", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });
      const sprintId = await t.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      // Create issues in the sprint
      await t.mutation(api.issues.create, {
        projectId,
        title: "Issue 1",
        type: "task",
        priority: "medium",
        sprintId,
      });
      await t.mutation(api.issues.create, {
        projectId,
        title: "Issue 2",
        type: "task",
        priority: "medium",
        sprintId,
      });

      const sprints = await t.query(api.sprints.listByProject, { projectId });

      expect(sprints).toHaveLength(1);
      expect(sprints[0]?.issueCount).toBe(2);
    });

    it("should return empty array for non-members of private project", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const other = await createTestUser(t, { name: "Other" });
      const projectId = await createTestProject(t, owner, { isPublic: false });

      t.withIdentity({ subject: owner });
      await t.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      // Other user tries to list sprints
      t.withIdentity({ subject: other });
      const sprints = await t.query(api.sprints.listByProject, { projectId });

      expect(sprints).toEqual([]);
    });

    it("should return sprints for public projects to all users", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const viewer = await createTestUser(t, { name: "Viewer" });
      const projectId = await createTestProject(t, owner, { isPublic: true });

      t.withIdentity({ subject: owner });
      await t.mutation(api.sprints.create, {
        projectId,
        name: "Public Sprint",
      });

      // Viewer can see public project sprints
      t.withIdentity({ subject: viewer });
      const sprints = await t.query(api.sprints.listByProject, { projectId });

      expect(sprints).toHaveLength(1);
      expect(sprints[0]?.name).toBe("Public Sprint");
    });

    it("should return empty array for unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const sprints = await t.query(api.sprints.listByProject, { projectId });
      expect(sprints).toEqual([]);
    });

    it("should return empty array for non-existent project", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      t.withIdentity({ subject: userId });
      const fakeProjectId = "jh71bgkqr4n1pfdx9e1pge7e717mah8k" as Id<"projects">;

      const sprints = await t.query(api.sprints.listByProject, {
        projectId: fakeProjectId,
      });

      expect(sprints).toEqual([]);
    });
  });

  describe("startSprint", () => {
    it("should start a future sprint", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });
      const sprintId = await t.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      const startDate = Date.now();
      const endDate = startDate + 14 * 24 * 60 * 60 * 1000;

      await t.mutation(api.sprints.startSprint, {
        sprintId,
        startDate,
        endDate,
      });

      const sprint = await t.run(async (ctx) => {
        return await ctx.db.get(sprintId);
      });

      expect(sprint?.status).toBe("active");
      expect(sprint?.startDate).toBe(startDate);
      expect(sprint?.endDate).toBe(endDate);
    });

    it("should complete currently active sprint when starting new one", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });

      // Create and start first sprint
      const sprint1Id = await t.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });
      const start1 = Date.now();
      await t.mutation(api.sprints.startSprint, {
        sprintId: sprint1Id,
        startDate: start1,
        endDate: start1 + 14 * 24 * 60 * 60 * 1000,
      });

      // Create and start second sprint
      const sprint2Id = await t.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 2",
      });
      const start2 = Date.now();
      await t.mutation(api.sprints.startSprint, {
        sprintId: sprint2Id,
        startDate: start2,
        endDate: start2 + 14 * 24 * 60 * 60 * 1000,
      });

      // First sprint should be completed
      const sprint1 = await t.run(async (ctx) => {
        return await ctx.db.get(sprint1Id);
      });
      expect(sprint1?.status).toBe("completed");

      // Second sprint should be active
      const sprint2 = await t.run(async (ctx) => {
        return await ctx.db.get(sprint2Id);
      });
      expect(sprint2?.status).toBe("active");
    });

    it("should allow project members to start sprint", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const member = await createTestUser(t, {
        name: "Member",
        email: "member@test.com",
      });
      const projectId = await createTestProject(t, owner);

      // Add member
      t.withIdentity({ subject: owner });
      await t.mutation(api.projects.addMember, {
        projectId,
        userEmail: "member@test.com",
        role: "editor",
      });

      const sprintId = await t.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      // Member starts sprint
      t.withIdentity({ subject: member });
      const startDate = Date.now();
      await t.mutation(api.sprints.startSprint, {
        sprintId,
        startDate,
        endDate: startDate + 14 * 24 * 60 * 60 * 1000,
      });

      const sprint = await t.run(async (ctx) => {
        return await ctx.db.get(sprintId);
      });
      expect(sprint?.status).toBe("active");
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });
      const sprintId = await t.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      t.withIdentity({ subject: undefined });
      await expect(async () => {
        await t.mutation(api.sprints.startSprint, {
          sprintId,
          startDate: Date.now(),
          endDate: Date.now() + 14 * 24 * 60 * 60 * 1000,
        });
      }).rejects.toThrow("Not authenticated");
    });

    it("should deny non-members from starting sprint", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const other = await createTestUser(t, { name: "Other" });
      const projectId = await createTestProject(t, owner);

      t.withIdentity({ subject: owner });
      const sprintId = await t.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      t.withIdentity({ subject: other });
      await expect(async () => {
        await t.mutation(api.sprints.startSprint, {
          sprintId,
          startDate: Date.now(),
          endDate: Date.now() + 14 * 24 * 60 * 60 * 1000,
        });
      }).rejects.toThrow("Not authorized");
    });

    it("should throw error for non-existent sprint", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      t.withIdentity({ subject: userId });
      const fakeSprintId = "jh71bgkqr4n1pfdx9e1pge7e717mah8k" as Id<"sprints">;

      await expect(async () => {
        await t.mutation(api.sprints.startSprint, {
          sprintId: fakeSprintId,
          startDate: Date.now(),
          endDate: Date.now() + 14 * 24 * 60 * 60 * 1000,
        });
      }).rejects.toThrow("Sprint not found");
    });
  });

  describe("completeSprint", () => {
    it("should complete an active sprint", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });
      const sprintId = await t.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      // Start the sprint
      const startDate = Date.now();
      await t.mutation(api.sprints.startSprint, {
        sprintId,
        startDate,
        endDate: startDate + 14 * 24 * 60 * 60 * 1000,
      });

      // Complete the sprint
      await t.mutation(api.sprints.completeSprint, { sprintId });

      const sprint = await t.run(async (ctx) => {
        return await ctx.db.get(sprintId);
      });

      expect(sprint?.status).toBe("completed");
    });

    it("should complete a future sprint (early completion)", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });
      const sprintId = await t.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      // Complete without starting
      await t.mutation(api.sprints.completeSprint, { sprintId });

      const sprint = await t.run(async (ctx) => {
        return await ctx.db.get(sprintId);
      });

      expect(sprint?.status).toBe("completed");
    });

    it("should allow project members to complete sprint", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const member = await createTestUser(t, {
        name: "Member",
        email: "member@test.com",
      });
      const projectId = await createTestProject(t, owner);

      // Add member
      t.withIdentity({ subject: owner });
      await t.mutation(api.projects.addMember, {
        projectId,
        userEmail: "member@test.com",
        role: "editor",
      });

      const sprintId = await t.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      // Member completes sprint
      t.withIdentity({ subject: member });
      await t.mutation(api.sprints.completeSprint, { sprintId });

      const sprint = await t.run(async (ctx) => {
        return await ctx.db.get(sprintId);
      });
      expect(sprint?.status).toBe("completed");
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      t.withIdentity({ subject: userId });
      const sprintId = await t.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      t.withIdentity({ subject: undefined });
      await expect(async () => {
        await t.mutation(api.sprints.completeSprint, { sprintId });
      }).rejects.toThrow("Not authenticated");
    });

    it("should deny non-members from completing sprint", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const other = await createTestUser(t, { name: "Other" });
      const projectId = await createTestProject(t, owner);

      t.withIdentity({ subject: owner });
      const sprintId = await t.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      t.withIdentity({ subject: other });
      await expect(async () => {
        await t.mutation(api.sprints.completeSprint, { sprintId });
      }).rejects.toThrow("Not authorized");
    });

    it("should throw error for non-existent sprint", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      t.withIdentity({ subject: userId });
      const fakeSprintId = "jh71bgkqr4n1pfdx9e1pge7e717mah8k" as Id<"sprints">;

      await expect(async () => {
        await t.mutation(api.sprints.completeSprint, { sprintId: fakeSprintId });
      }).rejects.toThrow("Sprint not found");
    });
  });
});
