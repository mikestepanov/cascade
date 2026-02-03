import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestUser,
} from "./testUtils";

describe("Document Security Vulnerability Reproduction", () => {
  it("allows cross-organization document creation (vulnerability)", async () => {
    const t = convexTest(schema, modules);

    // Create User A in Org A
    const userA = await createTestUser(t, { name: "User A" });
    const { organizationId: orgA } = await createOrganizationAdmin(t, userA);

    // Create User B in Org B
    const userB = await createTestUser(t, { name: "User B" });
    const { organizationId: orgB } = await createOrganizationAdmin(t, userB);

    // User B creates a project in Org B
    const projectB = await createProjectInOrganization(t, userB, orgB, {
      name: "Org B Project",
    });

    // User A attempts to create a document in Org A, but pointing to Project B (from Org B)
    const asUserA = asAuthenticatedUser(t, userA);

    // THIS SHOULD FAIL
    await expect(
      asUserA.mutation(api.documents.create, {
        title: "Malicious Document",
        isPublic: false,
        organizationId: orgA, // Valid: User A is in Org A
        projectId: projectB, // Invalid: Project B is in Org B!
      }),
    ).rejects.toThrow("Project does not belong to this organization");
  });

  it("allows cross-organization workspace document creation (vulnerability)", async () => {
    const t = convexTest(schema, modules);

    // Create User A in Org A
    const userA = await createTestUser(t, { name: "User A" });
    const { organizationId: orgA } = await createOrganizationAdmin(t, userA);

    // Create User B in Org B
    const userB = await createTestUser(t, { name: "User B" });
    const { organizationId: orgB, workspaceId: wsB } = await createOrganizationAdmin(t, userB);

    // User A attempts to create a document in Org A, but pointing to Workspace B (from Org B)
    const asUserA = asAuthenticatedUser(t, userA);

    // THIS SHOULD FAIL
    await expect(
      asUserA.mutation(api.documents.create, {
        title: "Malicious Workspace Document",
        isPublic: false,
        organizationId: orgA, // Valid: User A is in Org A
        workspaceId: wsB, // Invalid: Workspace B is in Org B!
      }),
    ).rejects.toThrow("Workspace does not belong to this organization");
  });
});
