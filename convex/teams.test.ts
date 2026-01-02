import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("Teams", () => {
  describe("createTeam", () => {
    it("should create a team for company members", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const asOwner = asAuthenticatedUser(t, ownerId);

      const { companyId } = await asOwner.mutation(api.companies.createCompany, {
        name: "Company",
        timezone: "UTC",
      });

      const { teamId, slug } = await asOwner.mutation(api.teams.createTeam, {
        companyId,
        name: "Engineering",
        isPrivate: false,
      });

      expect(teamId).toBeDefined();
      expect(slug).toBe("engineering");

      const team = await t.run(async (ctx) => ctx.db.get(teamId));
      expect(team?.name).toBe("Engineering");
      expect(team?.companyId).toBe(companyId);

      await t.finishInProgressScheduledFunctions();
    });

    it("should deny non-company members", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const outsiderId = await createTestUser(t);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { companyId } = await asOwner.mutation(api.companies.createCompany, {
        name: "Company",
        timezone: "UTC",
      });

      const asOutsider = asAuthenticatedUser(t, outsiderId);
      await expect(async () => {
        await asOutsider.mutation(api.teams.createTeam, {
          companyId,
          name: "Hacker Team",
          isPrivate: false,
        });
      }).rejects.toThrow("You must be a company member to create a team");

      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("softDelete and restore", () => {
    it("should soft delete and restore a team", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const asOwner = asAuthenticatedUser(t, ownerId);

      const { companyId } = await asOwner.mutation(api.companies.createCompany, {
        name: "Company",
        timezone: "UTC",
      });

      const { teamId } = await asOwner.mutation(api.teams.createTeam, {
        companyId,
        name: "Restore Me",
        isPrivate: false,
      });

      // Soft delete
      await asOwner.mutation(api.teams.softDeleteTeam, { teamId });

      const deletedTeam = await t.run(async (ctx) => ctx.db.get(teamId));
      expect(deletedTeam?.isDeleted).toBe(true);
      expect(deletedTeam?.deletedAt).toBeDefined();

      // Restore
      await asOwner.mutation(api.teams.restoreTeam, { teamId });

      const restoredTeam = await t.run(async (ctx) => ctx.db.get(teamId));
      expect(restoredTeam?.isDeleted).toBeUndefined();
      expect(restoredTeam?.deletedAt).toBeUndefined();

      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("members", () => {
    it("should add and remove team members", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const memberId = await createTestUser(t);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { companyId } = await asOwner.mutation(api.companies.createCompany, {
        name: "Company",
        timezone: "UTC",
      });

      // Add user to company first
      await asOwner.mutation(api.companies.addMember, {
        companyId,
        userId: memberId,
        role: "member",
      });

      const { teamId } = await asOwner.mutation(api.teams.createTeam, {
        companyId,
        name: "Team A",
        isPrivate: false,
      });

      // Add to team
      await asOwner.mutation(api.teams.addTeamMember, {
        teamId,
        userId: memberId,
        role: "member",
      });

      const members = await asOwner.query(api.teams.getTeamMembers, { teamId });
      expect(members).toHaveLength(2); // Owner + Member

      // Remove from team
      await asOwner.mutation(api.teams.removeTeamMember, {
        teamId,
        userId: memberId,
      });

      const membersAfter = await asOwner.query(api.teams.getTeamMembers, { teamId });
      expect(membersAfter).toHaveLength(1);

      await t.finishInProgressScheduledFunctions();
    });

    it("should enforce company membership constraint", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const outsiderId = await createTestUser(t);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { companyId } = await asOwner.mutation(api.companies.createCompany, {
        name: "Company",
        timezone: "UTC",
      });

      const { teamId } = await asOwner.mutation(api.teams.createTeam, {
        companyId,
        name: "Team A",
        isPrivate: false,
      });

      await expect(async () => {
        await asOwner.mutation(api.teams.addTeamMember, {
          teamId,
          userId: outsiderId,
          role: "member",
        });
      }).rejects.toThrow("User must be a company member to join this team");

      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("queries", () => {
    it("should list company teams", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { companyId } = await asUser.mutation(api.companies.createCompany, {
        name: "Company",
        timezone: "UTC",
      });

      await asUser.mutation(api.teams.createTeam, {
        companyId,
        name: "Team 1",
        isPrivate: false,
      });

      await asUser.mutation(api.teams.createTeam, {
        companyId,
        name: "Team 2",
        isPrivate: false,
      });

      const teams = await asUser.query(api.teams.getCompanyTeams, { companyId });
      expect(teams).toHaveLength(2);

      await t.finishInProgressScheduledFunctions();
    });

    it("should list user teams", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { companyId } = await asUser.mutation(api.companies.createCompany, {
        name: "Company",
        timezone: "UTC",
      });

      await asUser.mutation(api.teams.createTeam, {
        companyId,
        name: "Team 1",
        isPrivate: false,
      });
      // Auto joined as lead

      const teams = await asUser.query(api.teams.getUserTeams, {});
      expect(teams).toHaveLength(1);
      expect(teams[0].name).toBe("Team 1");

      await t.finishInProgressScheduledFunctions();
    });
  });
});
