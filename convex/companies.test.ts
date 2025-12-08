import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("Companies", () => {
  describe("createCompany", () => {
    it("should create a company and make creator owner", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { companyId, slug } = await asUser.mutation(api.companies.createCompany, {
        name: "Test Company",
        timezone: "America/New_York",
      });

      expect(companyId).toBeDefined();
      expect(slug).toBe("test-company");

      // Verify db state
      const company = await t.run(async (ctx) => ctx.db.get(companyId));
      expect(company?.name).toBe("Test Company");
      expect(company?.createdBy).toBe(userId);

      // Verify membership
      const membership = await t.run(async (ctx) =>
        ctx.db
          .query("companyMembers")
          .withIndex("by_company_user", (q) => q.eq("companyId", companyId).eq("userId", userId))
          .first(),
      );
      expect(membership?.role).toBe("owner");

      // Verify default company set
      const user = await t.run(async (ctx) => ctx.db.get(userId));
      expect(user?.defaultCompanyId).toBe(companyId);
    });

    it("should handle duplicate names by appending increment", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.companies.createCompany, {
        name: "Test Company",
        timezone: "America/New_York",
      });

      const { slug } = await asUser.mutation(api.companies.createCompany, {
        name: "Test Company",
        timezone: "America/Los_Angeles",
      });

      expect(slug).toBe("test-company-1");
    });
  });

  describe("updateCompany", () => {
    it("should allow admins to update details", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { companyId } = await asUser.mutation(api.companies.createCompany, {
        name: "Original Name",
        timezone: "America/New_York",
      });

      await asUser.mutation(api.companies.updateCompany, {
        companyId,
        name: "New Name",
        timezone: "UTC",
      });

      const company = await t.run(async (ctx) => ctx.db.get(companyId));
      expect(company?.name).toBe("New Name");
      expect(company?.slug).toBe("new-name");
      expect(company?.timezone).toBe("UTC");
    });

    it("should deny non-admins", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const otherId = await createTestUser(t);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { companyId } = await asOwner.mutation(api.companies.createCompany, {
        name: "Company",
        timezone: "UTC",
      });

      // Add normal member
      await asOwner.mutation(api.companies.addMember, {
        companyId,
        userId: otherId,
        role: "member",
      });

      const asOther = asAuthenticatedUser(t, otherId);
      await expect(async () => {
        await asOther.mutation(api.companies.updateCompany, {
          companyId,
          name: "Hacked",
        });
      }).rejects.toThrow("Only company admins can perform this action");
    });
  });

  describe("member management", () => {
    it("should add and remove members", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const memberId = await createTestUser(t);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { companyId } = await asOwner.mutation(api.companies.createCompany, {
        name: "Company",
        timezone: "UTC",
      });

      // Add member
      await asOwner.mutation(api.companies.addMember, {
        companyId,
        userId: memberId,
        role: "member",
      });

      // Verify member added
      const members = await asOwner.query(api.companies.getCompanyMembers, { companyId });
      expect(members).toHaveLength(2);

      // Remove member
      await asOwner.mutation(api.companies.removeMember, {
        companyId,
        userId: memberId,
      });

      // Verify member removed
      const membersAfter = await asOwner.query(api.companies.getCompanyMembers, { companyId });
      expect(membersAfter).toHaveLength(1);
      expect(membersAfter[0].userId).toBe(ownerId);
    });

    it("should prevent removing the owner", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const adminId = await createTestUser(t);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { companyId } = await asOwner.mutation(api.companies.createCompany, {
        name: "Company",
        timezone: "UTC",
      });

      // Add admin
      await asOwner.mutation(api.companies.addMember, {
        companyId,
        userId: adminId,
        role: "admin",
      });

      // Admin tries to remove owner
      const asAdmin = asAuthenticatedUser(t, adminId);
      await expect(async () => {
        await asAdmin.mutation(api.companies.removeMember, {
          companyId,
          userId: ownerId,
        });
      }).rejects.toThrow("Cannot remove company owner");
    });
  });

  describe("queries", () => {
    it("should get company if member", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      const { companyId, slug } = await asUser.mutation(api.companies.createCompany, {
        name: "My Company",
        timezone: "UTC",
      });

      const byId = await asUser.query(api.companies.getCompany, { companyId });
      expect(byId?.name).toBe("My Company");

      const bySlug = await asUser.query(api.companies.getCompanyBySlug, { slug });
      expect(bySlug?.name).toBe("My Company");
    });

    it("should return null if not member", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await createTestUser(t);
      const otherId = await createTestUser(t);

      const asOwner = asAuthenticatedUser(t, ownerId);
      const { companyId, slug } = await asOwner.mutation(api.companies.createCompany, {
        name: "Private Company",
        timezone: "UTC",
      });

      const asOther = asAuthenticatedUser(t, otherId);
      const byId = await asOther.query(api.companies.getCompany, { companyId });
      expect(byId).toBeNull();

      const bySlug = await asOther.query(api.companies.getCompanyBySlug, { slug });
      expect(bySlug).toBeNull();
    });

    it("should list user companies", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.companies.createCompany, {
        name: "Company A",
        timezone: "UTC",
      });

      await asUser.mutation(api.companies.createCompany, {
        name: "Company B",
        timezone: "UTC",
      });

      const companies = await asUser.query(api.companies.getUserCompanies, {});
      expect(companies).toHaveLength(2);
      // Note: order is not guaranteed by default unless specified in query, usually creation order
      expect(companies.some((c) => c.name === "Company A")).toBe(true);
      expect(companies.some((c) => c.name === "Company B")).toBe(true);
    });
  });
});
